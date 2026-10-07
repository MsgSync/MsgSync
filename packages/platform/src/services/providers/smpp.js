const defaultSmppLib = require('smpp');
const crypto = require('crypto');

const SUBMIT_TIMEOUT_MS = 30000;
const BIND_TIMEOUT_MS = 15000;
const MAX_RECONNECT_DELAY_MS = 60000;
const UDH_INDICATOR = 0x40;
const MESSAGE_STATES = {
    2: 'delivered',
    3: 'failed',
    4: 'failed',
    5: 'failed',
    6: 'sent',
    8: 'failed'
};
const RECEIPT_STATUS = {
    DELIVRD: 'delivered',
    EXPIRED: 'failed',
    DELETED: 'failed',
    UNDELIV: 'failed',
    REJECTD: 'failed',
    ACCEPTD: 'sent'
};

function isGsmCompatible(text) {
    return /^[\x20-\x7e\r\n]*$/.test(text);
}

function splitByCodeUnits(text, size) {
    const parts = [];
    let index = 0;
    while (index < text.length) {
        let end = Math.min(index + size, text.length);
        const last = text.charCodeAt(end - 1);
        if (end < text.length && last >= 0xd800 && last <= 0xdbff) end -= 1;
        parts.push(text.slice(index, end));
        index = end;
    }
    return parts;
}

/**
 * SMPP Protocol Provider
 * Maintains a bound SMPP 3.4 transceiver session, reconnects when it drops, submits
 * (concatenated) messages and routes delivery receipts to the delivery receipt service.
 */
class SMPPProvider {
    constructor(config, options = {}) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 2775,
            system_id: config.system_id,
            password: config.password,
            system_type: config.system_type || '',
            interface_version: config.interface_version || 0x34,
            addr_ton: config.addr_ton || 0,
            addr_npi: config.addr_npi || 0,
            address_range: config.address_range || '',
            source_addr: config.source_addr || config.system_id,
            enquire_link_period: config.enquire_link_period || 30000
        };
        this.smppLib = options.smppLib || defaultSmppLib;
        this.receiptHandler = options.receiptHandler || null;
        this.autoReconnect = options.autoReconnect !== false;
        this.session = null;
        this.isConnected = false;
        this.closing = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.connecting = null;
    }

    static configHash(config) {
        return crypto
            .createHash('sha1')
            .update(JSON.stringify(config || {}))
            .digest('hex');
    }

    connect() {
        if (this.isConnected) return Promise.resolve();
        if (this.connecting) return this.connecting;

        this.closing = false;
        this.connecting = this.openSession().finally(() => {
            this.connecting = null;
        });
        return this.connecting;
    }

    openSession() {
        return new Promise((resolve, reject) => {
            let settled = false;
            const fail = (error) => {
                if (settled) return;
                settled = true;
                clearTimeout(bindTimer);
                this.destroySession();
                reject(error);
            };

            const bindTimer = setTimeout(
                () => fail(new Error('SMPP bind timed out')),
                BIND_TIMEOUT_MS
            );

            const session = this.smppLib.connect(
                {
                    url: `smpp://${this.config.host}:${this.config.port}`,
                    auto_enquire_link_period: this.config.enquire_link_period,
                    debug: false
                },
                () => {
                    session.bind_transceiver(
                        {
                            system_id: this.config.system_id,
                            password: this.config.password,
                            system_type: this.config.system_type,
                            interface_version: this.config.interface_version,
                            addr_ton: this.config.addr_ton,
                            addr_npi: this.config.addr_npi,
                            address_range: this.config.address_range
                        },
                        (pdu) => {
                            if (settled) return;
                            if (pdu.command_status !== 0) {
                                return fail(
                                    new Error(
                                        `SMPP bind failed: ${this.describeStatus(pdu.command_status)}`
                                    )
                                );
                            }
                            settled = true;
                            clearTimeout(bindTimer);
                            this.isConnected = true;
                            this.reconnectAttempts = 0;
                            resolve();
                        }
                    );
                }
            );

            this.session = session;

            session.on('error', (error) => {
                console.error('[SMPP] Connection error:', error.message);
                if (!settled) return fail(error);
                this.isConnected = false;
            });

            session.on('close', () => {
                const wasConnected = this.isConnected;
                this.isConnected = false;
                if (!settled) return fail(new Error('SMPP connection closed before bind'));
                if (wasConnected && !this.closing) this.scheduleReconnect();
            });

            session.on('deliver_sm', (pdu) => {
                session.send(pdu.response());
                this.handleDeliverSm(pdu);
            });
        });
    }

    destroySession() {
        const session = this.session;
        this.session = null;
        this.isConnected = false;
        if (session) {
            session.removeAllListeners('close');
            try {
                session.close();
            } catch (error) {
                console.error('[SMPP] Error closing session:', error.message);
            }
        }
    }

    scheduleReconnect() {
        if (!this.autoReconnect || this.reconnectTimer) return;
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY_MS);
        this.reconnectAttempts += 1;
        console.warn(`[SMPP] Session lost, reconnecting in ${delay}ms`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.closing) return;
            this.connect().catch((error) => {
                console.error('[SMPP] Reconnect failed:', error.message);
                this.scheduleReconnect();
            });
        }, delay);
        if (this.reconnectTimer.unref) this.reconnectTimer.unref();
    }

    describeStatus(code) {
        const errors = this.smppLib.errors || {};
        const name = Object.keys(errors).find((key) => errors[key] === code);
        return name ? `${name} (0x${code.toString(16)})` : `0x${Number(code).toString(16)}`;
    }

    messageText(pdu) {
        const sm = pdu.short_message;
        if (sm === undefined || sm === null) return '';
        if (typeof sm === 'string') return sm;
        if (Buffer.isBuffer(sm)) return sm.toString('latin1');
        const message = sm.message;
        return Buffer.isBuffer(message) ? message.toString('latin1') : String(message || '');
    }

    /**
     * Extracts the receipted message id, status and error from a deliver_sm PDU.
     * Returns null when the PDU is not a delivery receipt.
     */
    parseReceipt(pdu) {
        const text = this.messageText(pdu);
        const isReceipt =
            (pdu.esm_class & 0x04) === 0x04 || pdu.receipted_message_id || /\bstat:\w+/i.test(text);
        if (!isReceipt) return null;

        const idMatch = text.match(/\bid:(\S+)/i);
        const statMatch = text.match(/\bstat:(\w+)/i);
        const errMatch = text.match(/\berr:(\w+)/i);

        const externalId = pdu.receipted_message_id || (idMatch && idMatch[1]);
        const status = statMatch
            ? RECEIPT_STATUS[statMatch[1].toUpperCase()] || null
            : MESSAGE_STATES[pdu.message_state] || null;
        const errorCode = errMatch && !/^0+$/.test(errMatch[1]) ? errMatch[1] : null;

        if (!externalId) return null;
        return {
            externalId: String(externalId).replace(/\0/g, ''),
            status,
            error:
                status === 'failed'
                    ? `SMPP ${statMatch?.[1] || 'FAILED'} err:${errorCode || '000'}`
                    : null
        };
    }

    async handleDeliverSm(pdu) {
        try {
            const receipt = this.parseReceipt(pdu);
            if (!receipt || !receipt.status) return;

            const handler =
                this.receiptHandler ||
                require('../deliveryReceiptService').applyReceipt.bind(
                    require('../deliveryReceiptService')
                );
            const candidates = [receipt.externalId];
            const stripped = receipt.externalId.replace(/^0+/, '');
            if (stripped && stripped !== receipt.externalId) candidates.push(stripped);

            for (const externalId of candidates) {
                const result = await handler({ ...receipt, externalId });
                if (result.reason !== 'not_found') {
                    console.log(`[SMPP] Receipt ${externalId} -> ${receipt.status}`);
                    return;
                }
            }
        } catch (error) {
            console.error('[SMPP] Error processing delivery receipt:', error);
        }
    }

    sourceAddress(senderId) {
        const address = String(senderId || this.config.source_addr || '');
        if (/^\+?\d+$/.test(address)) {
            return {
                source_addr: address.replace('+', ''),
                source_addr_ton: 1,
                source_addr_npi: 1
            };
        }
        return { source_addr: address.slice(0, 11), source_addr_ton: 5, source_addr_npi: 0 };
    }

    buildParts(content) {
        const text = String(content);
        const gsm = isGsmCompatible(text);
        const single = gsm ? 160 : 70;
        const segment = gsm ? 153 : 67;
        const dataCoding = gsm ? 0 : 8;

        if (text.length <= single) {
            return [{ short_message: text, data_coding: dataCoding }];
        }

        const reference = crypto.randomInt(0, 256);
        const chunks = splitByCodeUnits(text, segment);
        if (chunks.length > 255) throw new Error('Message too long for SMPP concatenation');
        return chunks.map((chunk, index) => ({
            esm_class: UDH_INDICATOR,
            data_coding: dataCoding,
            short_message: {
                udh: Buffer.from([0x05, 0x00, 0x03, reference, chunks.length, index + 1]),
                message: chunk
            }
        }));
    }

    submit(params) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.session) {
                return reject(new Error('SMPP session not connected'));
            }
            const timer = setTimeout(
                () => reject(new Error('SMPP submit timed out')),
                SUBMIT_TIMEOUT_MS
            );
            this.session.submit_sm(params, (pdu) => {
                clearTimeout(timer);
                if (pdu.command_status === 0) return resolve(pdu.message_id);
                const error = new Error(
                    `SMPP submit failed: ${this.describeStatus(pdu.command_status)}`
                );
                error.commandStatus = pdu.command_status;
                reject(error);
            });
        });
    }

    async sendMessage(recipient, content, messageId, options = {}) {
        const source = this.sourceAddress(options.senderId);
        const destination = String(recipient).replace(/^\+/, '');
        const ids = [];

        for (const part of this.buildParts(content)) {
            ids.push(
                await this.submit({
                    ...source,
                    dest_addr_ton: 1,
                    dest_addr_npi: 1,
                    destination_addr: destination,
                    registered_delivery: 1,
                    ...part
                })
            );
        }

        return {
            success: true,
            externalId: ids[0],
            partIds: ids,
            provider: 'smpp'
        };
    }

    async disconnect() {
        this.closing = true;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
        this.destroySession();
    }
}

module.exports = SMPPProvider;
