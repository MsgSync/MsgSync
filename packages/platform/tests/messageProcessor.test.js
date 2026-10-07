const mockPrisma = {
    message: { findUnique: jest.fn(), update: jest.fn() },
    organization: { findUnique: jest.fn() },
    provider: { findFirst: jest.fn() }
};

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }));
jest.mock('../src/services/providerService', () => ({ deliverWithFailover: jest.fn() }));
jest.mock('../src/services/lookupService', () => ({ performLookup: jest.fn() }));
jest.mock('../src/services/rateService', () => ({ lookupRateForOrganization: jest.fn() }));
jest.mock('../src/services/organizationService', () => ({ updateBalance: jest.fn() }));
jest.mock('../src/services/aiService', () => ({
    analyzeSentiment: jest.fn().mockResolvedValue({ sentiment: 'neutral', score: 0 })
}));
jest.mock('../src/services/securityService', () => ({
    isDailySpendLimitReached: jest.fn().mockResolvedValue(false)
}));
jest.mock('../src/services/webhookService', () => ({ triggerStatusChange: jest.fn() }));

const providerService = require('../src/services/providerService');
const lookupService = require('../src/services/lookupService');
const rateService = require('../src/services/rateService');
const organizationService = require('../src/services/organizationService');
const { processMessage } = require('../src/services/messageProcessor');

const baseMessage = {
    id: 'm1',
    organizationId: 'o1',
    recipient: '+12025550100',
    content: 'hi',
    status: 'queued',
    metadata: {}
};

describe('processMessage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.message.findUnique.mockResolvedValue({ ...baseMessage });
        mockPrisma.message.update.mockImplementation(async ({ data }) => ({
            ...baseMessage,
            ...data
        }));
        mockPrisma.provider.findFirst.mockResolvedValue({ costPerSms: 0.01 });
        lookupService.performLookup.mockResolvedValue({ mcc: '310', mnc: '260' });
        rateService.lookupRateForOrganization.mockResolvedValue({ pricePerSms: 0.05 });
        providerService.deliverWithFailover.mockResolvedValue({
            success: true,
            externalId: 'x1',
            providerUsed: 'p'
        });
    });

    it('does not resend messages that were already sent', async () => {
        mockPrisma.message.findUnique.mockResolvedValue({ ...baseMessage, status: 'sent' });

        await processMessage('m1');

        expect(providerService.deliverWithFailover).not.toHaveBeenCalled();
    });

    it('debits the organization after a successful send', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({
            billingPolicy: 'ON_SUBMISSION',
            type: 'CLIENT',
            balance: 1
        });

        await processMessage('m1');

        expect(lookupService.performLookup).toHaveBeenCalledWith('+12025550100');
        expect(organizationService.updateBalance).toHaveBeenCalledWith(
            'o1',
            0.05,
            'DEBIT',
            expect.any(String)
        );
    });

    it('rejects without sending when balance is insufficient', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({
            billingPolicy: 'ON_SUBMISSION',
            type: 'CLIENT',
            balance: 0.01
        });

        const result = await processMessage('m1');

        expect(result.success).toBe(false);
        expect(providerService.deliverWithFailover).not.toHaveBeenCalled();
        expect(organizationService.updateBalance).not.toHaveBeenCalled();
    });

    it('does not bill admin organizations', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({
            billingPolicy: 'ON_SUBMISSION',
            type: 'ADMIN',
            balance: 0
        });

        await processMessage('m1');

        expect(providerService.deliverWithFailover).toHaveBeenCalled();
        expect(organizationService.updateBalance).not.toHaveBeenCalled();
    });
});
