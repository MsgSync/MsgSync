const { normalizeMessage } = require('../src/services/aggregator');

describe('Aggregator Normalization', () => {
    test('should normalize SMS from Twilio-like source', () => {
        const rawSms = {
            sid: 'SM123',
            from: '+1234567890',
            to: '+0987654321',
            body: 'Hello from SMS'
        };

        const normalized = normalizeMessage(rawSms, 'Twilio', 'sms');

        expect(normalized.externalId).toBe('SM123');
        expect(normalized.sender).toBe('+1234567890');
        expect(normalized.recipient).toBe('+0987654321');
        expect(normalized.content).toBe('Hello from SMS');
        expect(normalized.source).toBe('Twilio');
        expect(normalized.sourceType).toBe('sms');
    });

    test('should normalize Email from SendGrid-like source', () => {
        const rawEmail = {
            messageId: 'MSG456',
            from: 'sender@example.com',
            to: 'receiver@example.com',
            subject: 'Test Subject',
            body: 'Test Body'
        };

        const normalized = normalizeMessage(rawEmail, 'SendGrid', 'email');

        expect(normalized.externalId).toBe('MSG456');
        expect(normalized.sender).toBe('sender@example.com');
        expect(normalized.recipient).toBe('receiver@example.com');
        expect(normalized.content).toBe('Test Subject: Test Body');
        expect(normalized.source).toBe('SendGrid');
        expect(normalized.sourceType).toBe('email');
    });

    test('should normalize Webhook data', () => {
        const rawWebhook = {
            id: 'WH789',
            sender_id: 'user_1',
            recipient_id: 'user_2',
            message_text: 'Hello via Webhook'
        };

        const normalized = normalizeMessage(rawWebhook, 'MyWebhook', 'webhook');

        expect(normalized.externalId).toBe('WH789');
        expect(normalized.sender).toBe('user_1');
        expect(normalized.recipient).toBe('user_2');
        expect(normalized.content).toBe('Hello via Webhook');
        expect(normalized.source).toBe('MyWebhook');
        expect(normalized.sourceType).toBe('webhook');
    });
});
