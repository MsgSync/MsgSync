const mockPrisma = {
    message: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    organization: { findUnique: jest.fn() },
    provider: { findFirst: jest.fn(), findUnique: jest.fn() }
};

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }));
jest.mock('../src/services/webhookService', () => ({ triggerStatusChange: jest.fn() }));
jest.mock('../src/services/lookupService', () => ({ performLookup: jest.fn() }));
jest.mock('../src/services/rateService', () => ({ lookupRateForOrganization: jest.fn() }));
jest.mock('../src/services/organizationService', () => ({ updateBalance: jest.fn() }));

const request = require('supertest');
const express = require('express');
const twilio = require('twilio');
const webhookService = require('../src/services/webhookService');
const lookupService = require('../src/services/lookupService');
const rateService = require('../src/services/rateService');
const organizationService = require('../src/services/organizationService');
const receiptService = require('../src/services/deliveryReceiptService');
const receiptRoutes = require('../src/routes/receipts');

const app = express();
app.use('/api/receipts', receiptRoutes);

const message = {
    id: 'm1',
    externalId: 'SM1',
    organizationId: 'o1',
    recipient: '+12025550100',
    provider: 'tw',
    status: 'sent',
    price: 0,
    profile: 'TRANSACTIONAL'
};

describe('deliveryReceiptService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.message.findUnique.mockResolvedValue({ ...message });
        mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.message.update.mockResolvedValue({});
    });

    it('normalizes provider statuses', () => {
        expect(receiptService.normalizeStatus('DELIVRD')).toBe('delivered');
        expect(receiptService.normalizeStatus('undelivered')).toBe('failed');
        expect(receiptService.normalizeStatus('queued')).toBeNull();
        expect(receiptService.normalizeStatus('ok', { ok: 'delivered' })).toBe('delivered');
    });

    it('marks a message delivered and triggers the webhook', async () => {
        mockPrisma.message.findUnique
            .mockResolvedValueOnce({ ...message })
            .mockResolvedValueOnce({ ...message, status: 'delivered' });
        mockPrisma.organization.findUnique.mockResolvedValue({
            billingPolicy: 'ON_SUBMISSION',
            type: 'CLIENT'
        });

        const result = await receiptService.applyReceipt({
            externalId: 'SM1',
            status: 'delivered'
        });

        expect(result.applied).toBe(true);
        expect(mockPrisma.message.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'm1', status: { not: 'delivered' } },
                data: expect.objectContaining({ status: 'delivered' })
            })
        );
        expect(webhookService.triggerStatusChange).toHaveBeenCalled();
        expect(organizationService.updateBalance).not.toHaveBeenCalled();
    });

    it('is idempotent for already delivered messages', async () => {
        mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

        const result = await receiptService.applyReceipt({
            externalId: 'SM1',
            status: 'delivered'
        });

        expect(result.applied).toBe(false);
        expect(webhookService.triggerStatusChange).not.toHaveBeenCalled();
    });

    it('does not downgrade a sent message back to sent', async () => {
        const result = await receiptService.applyReceipt({ externalId: 'SM1', status: 'sent' });

        expect(result.applied).toBe(false);
        expect(mockPrisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('bills on delivery for ON_DELIVERY organizations', async () => {
        mockPrisma.message.findUnique
            .mockResolvedValueOnce({ ...message })
            .mockResolvedValueOnce({ ...message, status: 'delivered' });
        mockPrisma.organization.findUnique.mockResolvedValue({
            billingPolicy: 'ON_DELIVERY',
            type: 'CLIENT'
        });
        lookupService.performLookup.mockResolvedValue(null);
        rateService.lookupRateForOrganization.mockResolvedValue({ pricePerSms: 0.05 });

        await receiptService.applyReceipt({ externalId: 'SM1', status: 'delivered' });

        expect(mockPrisma.message.update).toHaveBeenCalledWith({
            where: { id: 'm1' },
            data: { price: 0.05 }
        });
        expect(organizationService.updateBalance).toHaveBeenCalledWith(
            'o1',
            0.05,
            'DEBIT',
            expect.any(String)
        );
    });
});

describe('receipt routes', () => {
    const authToken = 'tw-token';
    const baseUrl = 'https://api.example.com';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.PUBLIC_BASE_URL = baseUrl;
        mockPrisma.message.findUnique.mockResolvedValue({ ...message });
        mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.organization.findUnique.mockResolvedValue({
            billingPolicy: 'ON_SUBMISSION',
            type: 'CLIENT'
        });
    });

    afterAll(() => {
        delete process.env.PUBLIC_BASE_URL;
    });

    it('accepts a correctly signed Twilio callback', async () => {
        mockPrisma.provider.findFirst.mockResolvedValue({ config: { authToken } });
        const params = { MessageSid: 'SM1', MessageStatus: 'delivered' };
        const signature = twilio.getExpectedTwilioSignature(
            authToken,
            `${baseUrl}/api/receipts/twilio`,
            params
        );

        const res = await request(app)
            .post('/api/receipts/twilio')
            .set('X-Twilio-Signature', signature)
            .type('form')
            .send(params);

        expect(res.status).toBe(200);
        expect(res.body.applied).toBe(true);
    });

    it('rejects a Twilio callback with a bad signature', async () => {
        mockPrisma.provider.findFirst.mockResolvedValue({ config: { authToken } });

        const res = await request(app)
            .post('/api/receipts/twilio')
            .set('X-Twilio-Signature', 'bad')
            .type('form')
            .send({ MessageSid: 'SM1', MessageStatus: 'delivered' });

        expect(res.status).toBe(403);
        expect(mockPrisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('requires the shared secret for generic HTTP receipts', async () => {
        mockPrisma.provider.findUnique.mockResolvedValue({
            config: { dlr: { secret: 's3cret', statusField: 'state' } }
        });

        const denied = await request(app)
            .post('/api/receipts/http/p1')
            .set('X-DLR-Secret', 'wrong')
            .send({ id: 'SM1', state: 'delivered' });
        expect(denied.status).toBe(403);

        const ok = await request(app)
            .post('/api/receipts/http/p1')
            .set('X-DLR-Secret', 's3cret')
            .send([{ id: 'SM1', state: 'delivered' }]);
        expect(ok.status).toBe(200);
        expect(ok.body.applied).toBe(1);
    });

    it('404s for providers without receipts enabled', async () => {
        mockPrisma.provider.findUnique.mockResolvedValue({ config: {} });

        const res = await request(app).post('/api/receipts/http/p1').send({});

        expect(res.status).toBe(404);
    });
});
