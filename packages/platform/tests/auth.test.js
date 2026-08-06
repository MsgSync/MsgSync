const authenticate = require('../src/middleware/auth');
const { PrismaClient } = require('@prisma/client');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
    const mPrisma = {
        apiKey: {
            findUnique: jest.fn()
        }
    };
    return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should return 401 if no API key is provided', async () => {
        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'error',
                message: expect.stringContaining('Authentication required')
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate with a valid X-API-Key header', async () => {
        const mockApiKey = { id: '1', key: 'valid-key', active: true };
        req.headers['x-api-key'] = 'valid-key';
        prisma.apiKey.findUnique.mockResolvedValue(mockApiKey);

        await authenticate(req, res, next);

        expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
            where: { key: 'valid-key' },
            include: { organization: true }
        });
        expect(req.apiKey).toEqual(mockApiKey);
        expect(next).toHaveBeenCalled();
    });

    it('should authenticate with a valid Authorization Bearer token', async () => {
        const mockApiKey = { id: '1', key: 'valid-token', active: true };
        req.headers['authorization'] = 'Bearer valid-token';
        prisma.apiKey.findUnique.mockResolvedValue(mockApiKey);

        await authenticate(req, res, next);

        expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
            where: { key: 'valid-token' },
            include: { organization: true }
        });
        expect(req.apiKey).toEqual(mockApiKey);
        expect(next).toHaveBeenCalled();
    });

    it('should return 403 for an invalid API key', async () => {
        req.headers['x-api-key'] = 'invalid-key';
        prisma.apiKey.findUnique.mockResolvedValue(null);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'error',
                message: 'Invalid or inactive API key.'
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for an inactive API key', async () => {
        req.headers['x-api-key'] = 'inactive-key';
        prisma.apiKey.findUnique.mockResolvedValue({
            id: '2',
            key: 'inactive-key',
            active: false
        });

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
