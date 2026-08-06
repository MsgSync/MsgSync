const smpp = require('smpp');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SMPP Protocol Provider
 * Supports industry-standard SMPP 3.4 for direct carrier integration
 */
class SMPPProvider {
    constructor(config) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 2775,
            system_id: config.system_id,
            password: config.password,
            system_type: config.system_type || '',
            interface_version: config.interface_version || 0x34,
            addr_ton: config.addr_ton || 0,
            addr_npi: config.addr_npi || 0,
            address_range: config.address_range || ''
        };
        this.session = null;
        this.isConnected = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.session = smpp.connect(
                {
                    url: `smpp://${this.config.host}:${this.config.port}`,
                    auto_enquire_link_period: 10000,
                    debug: process.env.NODE_ENV !== 'production'
                },
                () => {
                    this.session.bind_transceiver(
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
                            if (pdu.command_status === 0) {
                                this.isConnected = true;
                                console.log('[SMPP] Successfully bound to SMSC');
                                this.setupEventHandlers();
                                resolve();
                            } else {
                                reject(new Error(`SMPP bind failed: ${pdu.command_status}`));
                            }
                        }
                    );
                }
            );

            this.session.on('error', (error) => {
                console.error('[SMPP] Connection error:', error);
                this.isConnected = false;
                reject(error);
            });
        });
    }

    setupEventHandlers() {
    // Handle incoming delivery receipts
        this.session.on('deliver_sm', (pdu) => {
            this.handleDeliveryReceipt(pdu);
            this.session.send(pdu.response());
        });

        // Handle connection close
        this.session.on('close', () => {
            console.log('[SMPP] Connection closed');
            this.isConnected = false;
        });
    }

    async handleDeliveryReceipt(pdu) {
        try {
            const messageId = pdu.short_message.message.toString();
            const status = this.parseDeliveryStatus(pdu);

            await prisma.message.update({
                where: { externalId: messageId },
                data: {
                    status: status,
                    deliveredAt: status === 'delivered' ? new Date() : null
                }
            });

            console.log(
                `[SMPP] Delivery receipt processed: ${messageId} -> ${status}`
            );
        } catch (error) {
            console.error('[SMPP] Error processing delivery receipt:', error);
        }
    }

    parseDeliveryStatus(pdu) {
        const stat = pdu.stat || pdu.message_state;
        const statusMap = {
            DELIVRD: 'delivered',
            EXPIRED: 'failed',
            DELETED: 'failed',
            UNDELIV: 'failed',
            ACCEPTD: 'sent',
            UNKNOWN: 'queued',
            REJECTD: 'failed'
        };
        return statusMap[stat] || 'queued';
    }

    async sendMessage(recipient, content, messageId) {
        if (!this.isConnected) {
            throw new Error('SMPP session not connected');
        }

        return new Promise((resolve, reject) => {
            this.session.submit_sm(
                {
                    source_addr: this.config.system_id,
                    destination_addr: recipient,
                    short_message: content,
                    registered_delivery: 1 // Request delivery receipt
                },
                (pdu) => {
                    if (pdu.command_status === 0) {
                        resolve({
                            success: true,
                            externalId: pdu.message_id,
                            provider: 'smpp'
                        });
                    } else {
                        reject(new Error(`SMPP submit failed: ${pdu.command_status}`));
                    }
                }
            );
        });
    }

    async disconnect() {
        if (this.session) {
            this.session.close();
            this.isConnected = false;
        }
    }
}

module.exports = SMPPProvider;
