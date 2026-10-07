const mockTx = {
    organization: { update: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
    transaction: { create: jest.fn() }
};
const mockPrisma = { $transaction: jest.fn((fn) => fn(mockTx)) };

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }));

const organizationService = require('../src/services/organizationService');

describe('organizationService balances', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockTx.organization.updateMany.mockResolvedValue({ count: 1 });
        mockTx.organization.findUnique.mockResolvedValue({ id: 'x', balance: 5 });
    });

    it('rejects non-positive or non-numeric amounts', async () => {
        await expect(organizationService.updateBalance('o', -5, 'CREDIT')).rejects.toThrow(
            /positive/
        );
        await expect(organizationService.updateBalance('o', 'abc', 'CREDIT')).rejects.toThrow(
            /positive/
        );
        await expect(organizationService.updateBalance('o', 0, 'DEBIT')).rejects.toThrow(
            /positive/
        );
    });

    it('fails a debit atomically when funds are insufficient', async () => {
        mockTx.organization.updateMany.mockResolvedValue({ count: 0 });

        await expect(organizationService.updateBalance('o', 10, 'DEBIT')).rejects.toThrow(
            'Insufficient balance'
        );
        expect(mockTx.transaction.create).not.toHaveBeenCalled();
    });

    it('transfers by debiting the source and crediting the target', async () => {
        await organizationService.transferBalance('from', 'to', 10);

        expect(mockTx.organization.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'from', balance: { gte: 10 } } })
        );
        expect(mockTx.organization.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'to' } })
        );
        expect(mockTx.transaction.create).toHaveBeenCalledTimes(2);
    });

    it('refuses to transfer to the same organization', async () => {
        await expect(organizationService.transferBalance('a', 'a', 1)).rejects.toThrow(/same/);
    });
});
