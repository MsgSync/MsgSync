const mockPrisma = {
    campaign: { findUnique: jest.fn(), updateMany: jest.fn() },
    message: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() }
};

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }));
jest.mock('../src/queue/messageQueue', () => ({ add: jest.fn() }));

const messageQueue = require('../src/queue/messageQueue');
const campaignService = require('../src/services/campaignService');

const campaign = {
    id: 'c1',
    name: 'Sale',
    template: 'Hi {{firstName}}, code {{code}} $& {{missing}}',
    status: 'running',
    organizationId: 'o1',
    apiKeyId: 'k1',
    senderId: null,
    scheduledAt: null,
    enableTracking: true,
    contactList: {
        contacts: [
            { phone: '+1', firstName: 'Ann', lastName: '', attributes: { code: '$&X' } },
            { phone: '+2', firstName: 'Bob', lastName: '', attributes: {} }
        ]
    }
};

describe('campaignService.processCampaign', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.campaign.findUnique.mockImplementation(async (args) =>
            args.include ? campaign : { status: 'running' }
        );
        mockPrisma.campaign.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.message.findMany.mockResolvedValue([]);
        mockPrisma.message.create.mockImplementation(async ({ data }) => ({
            id: `m-${data.recipient}`
        }));
    });

    it('renders templates literally and marks the campaign completed', async () => {
        await campaignService.processCampaign('c1');

        const first = mockPrisma.message.create.mock.calls[0][0].data;
        expect(first.content).toBe('Hi Ann, code $&X $& ');
        expect(messageQueue.add).toHaveBeenCalledTimes(2);
        expect(mockPrisma.campaign.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'c1', status: { in: ['running'] } },
                data: expect.objectContaining({ status: 'completed' })
            })
        );
    });

    it('skips contacts that were already messaged', async () => {
        mockPrisma.message.findMany.mockResolvedValue([{ recipient: '+1' }]);

        await campaignService.processCampaign('c1');

        expect(mockPrisma.message.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.message.create.mock.calls[0][0].data.recipient).toBe('+2');
    });

    it('stops when the campaign is paused mid-run', async () => {
        mockPrisma.campaign.findUnique.mockImplementation(async (args) =>
            args.include ? campaign : { status: 'paused' }
        );

        await campaignService.processCampaign('c1');

        expect(mockPrisma.message.create).not.toHaveBeenCalled();
        expect(mockPrisma.campaign.updateMany).not.toHaveBeenCalled();
    });

    it('does nothing when the campaign is not running', async () => {
        mockPrisma.campaign.findUnique.mockResolvedValue({ ...campaign, status: 'draft' });

        await campaignService.processCampaign('c1');

        expect(mockPrisma.message.create).not.toHaveBeenCalled();
    });
});
