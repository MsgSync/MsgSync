const crypto = require('crypto');
const mockPrisma = {
    refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn()
    },
    $transaction: jest.fn((fn) => fn(mockPrisma))
};

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }));
jest.mock('../src/services/auditService', () => ({ log: jest.fn() }));

const tokenService = require('../src/services/tokenService');

describe('tokenService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.refreshToken.create.mockImplementation(async ({ data }) => ({
            id: 'rt1',
            ...data
        }));
    });

    it('issues a hashed refresh token', async () => {
        const result = await tokenService.issue('u1');

        expect(result.token).toBeTruthy();
        expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
        expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tokenHash: tokenService.hash(result.token),
                userId: 'u1'
            })
        });
    });

    it('rotates a valid token and revokes the old one', async () => {
        const original = await tokenService.issue('u1');
        mockPrisma.refreshToken.findUnique.mockResolvedValue({
            id: 'rt1',
            tokenHash: tokenService.hash(original.token),
            userId: 'u1',
            expiresAt: new Date(Date.now() + 10000),
            revokedAt: null
        });

        const rotated = await tokenService.rotate(original.token);

        expect(rotated.token).not.toBe(original.token);
        expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
            where: { id: 'rt1' },
            data: { revokedAt: expect.any(Date) }
        });
    });

    it('revokes all tokens when a reused token is presented', async () => {
        const original = await tokenService.issue('u1');
        await tokenService.rotate(original.token);
        mockPrisma.refreshToken.findUnique.mockResolvedValue({
            id: 'rt1',
            tokenHash: tokenService.hash(original.token),
            userId: 'u1',
            expiresAt: new Date(Date.now() + 10000),
            revokedAt: new Date()
        });

        const result = await tokenService.rotate(original.token);

        expect(result).toBeNull();
        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: 'u1', revokedAt: null } })
        );
    });

    it('rejects expired tokens', async () => {
        const original = await tokenService.issue('u1');
        mockPrisma.refreshToken.findUnique.mockResolvedValue({
            id: 'rt1',
            tokenHash: tokenService.hash(original.token),
            userId: 'u1',
            expiresAt: new Date(Date.now() - 1000),
            revokedAt: null
        });

        expect(await tokenService.rotate(original.token)).toBeNull();
    });

    it('revokes a single token on logout', async () => {
        await tokenService.revoke('abc');

        expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
            where: { tokenHash: tokenService.hash('abc'), revokedAt: null },
            data: { revokedAt: expect.any(Date) }
        });
    });
});
