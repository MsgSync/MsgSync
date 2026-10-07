const smpp = require('smpp');
const SMPPProvider = require('../src/services/providers/smpp');

function startServer({ bindStatus = 0, submitStatus = 0 } = {}) {
    const submits = [];
    const sessions = [];
    const server = smpp.createServer({}, (session) => {
        sessions.push(session);
        session.on('error', () => {});
        session.on('bind_transceiver', (pdu) => {
            session.send(pdu.response({ command_status: bindStatus }));
        });
        session.on('submit_sm', (pdu) => {
            submits.push(pdu);
            session.send(
                pdu.response({
                    command_status: submitStatus,
                    message_id: `ID${submits.length}`
                })
            );
        });
        session.on('enquire_link', (pdu) => session.send(pdu.response()));
    });

    return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            resolve({ server, submits, sessions, port: server.address().port });
        });
    });
}

describe('SMPPProvider', () => {
    let ctx;
    let provider;
    const receipts = [];

    const create = (config = {}) =>
        new SMPPProvider(
            { host: '127.0.0.1', port: ctx.port, system_id: 'sys', password: 'pw', ...config },
            {
                autoReconnect: false,
                receiptHandler: async (receipt) => {
                    receipts.push(receipt);
                    return { applied: true };
                }
            }
        );

    beforeEach(async () => {
        receipts.length = 0;
        ctx = await startServer();
        provider = create();
    });

    afterEach(async () => {
        await provider.disconnect();
        await new Promise((resolve) => {
            ctx.sessions.forEach((s) => s.close());
            ctx.server.close(resolve);
        });
    });

    it('binds once and reuses the session', async () => {
        await provider.connect();
        await provider.connect();
        await provider.sendMessage('+12025550100', 'one', 'm1');
        await provider.sendMessage('+12025550100', 'two', 'm2');

        expect(ctx.sessions).toHaveLength(1);
        expect(ctx.submits).toHaveLength(2);
    });

    it('uses the campaign sender id and requests receipts', async () => {
        await provider.connect();
        const result = await provider.sendMessage('+12025550100', 'hello', 'm1', {
            senderId: 'BRAND'
        });

        const pdu = ctx.submits[0];
        expect(result.externalId).toBe('ID1');
        expect(pdu.source_addr).toBe('BRAND');
        expect(pdu.source_addr_ton).toBe(5);
        expect(pdu.destination_addr).toBe('12025550100');
        expect(pdu.registered_delivery).toBe(1);
    });

    it('splits long messages with a concatenation header', async () => {
        await provider.connect();
        const result = await provider.sendMessage('+12025550100', 'a'.repeat(400), 'm1');

        expect(ctx.submits).toHaveLength(3);
        expect(result.partIds).toEqual(['ID1', 'ID2', 'ID3']);
        const udh = ctx.submits[1].short_message.udh[0];
        expect(udh[3]).toBe(3);
        expect(udh[4]).toBe(2);
    });

    it('encodes non-GSM text as UCS2', async () => {
        await provider.connect();
        await provider.sendMessage('+12025550100', 'héllo 😀 привет', 'm1');

        expect(ctx.submits[0].data_coding).toBe(8);
        expect(ctx.submits[0].short_message.message).toBe('héllo 😀 привет');
    });

    it('fails with a readable error when submit is rejected', async () => {
        await new Promise((resolve) => ctx.server.close(resolve));
        ctx = await startServer({ submitStatus: smpp.errors.ESME_RTHROTTLED });
        provider = create();
        await provider.connect();

        await expect(provider.sendMessage('+12025550100', 'x', 'm1')).rejects.toThrow(
            /ESME_RTHROTTLED/
        );
    });

    it('rejects on bind failure without leaking the session', async () => {
        await new Promise((resolve) => ctx.server.close(resolve));
        ctx = await startServer({ bindStatus: smpp.errors.ESME_RBINDFAIL });
        provider = create();

        await expect(provider.connect()).rejects.toThrow(/bind failed/);
        expect(provider.isConnected).toBe(false);
        expect(provider.session).toBeNull();
    });

    it('routes delivery receipts to the receipt handler', async () => {
        await provider.connect();
        const text =
            'id:ID1 sub:001 dlvrd:001 submit date:2610070000 done date:2610070001 stat:DELIVRD err:000 text:hi';
        ctx.sessions[0].deliver_sm(
            { esm_class: 0x04, short_message: text, source_addr: '12025550100' },
            () => {}
        );

        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(receipts).toEqual([{ externalId: 'ID1', status: 'delivered', error: null }]);
    });

    it('parses failed receipts and ignores non-receipt deliveries', () => {
        const failed = provider.parseReceipt({
            esm_class: 0x04,
            short_message: { message: 'id:0042 stat:UNDELIV err:069 text:x' }
        });
        expect(failed).toMatchObject({ externalId: '0042', status: 'failed' });
        expect(failed.error).toContain('069');

        expect(
            provider.parseReceipt({ esm_class: 0, short_message: { message: 'hello there' } })
        ).toBeNull();
    });
});
