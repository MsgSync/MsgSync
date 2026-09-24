const request = require('supertest');
const app = require('../src/index');

jest.mock('@prisma/client', () => {
    const mockPrisma = {
        message: { create: jest.fn() },
        apiKey: { findUnique: jest.fn() },
        transaction: { aggregate: jest.fn() }
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma)
    };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock Auth Middleware
jest.mock('../src/middleware/auth', () => (req, res, next) => {
    req.apiKey = { id: '1', key: 'test-key', active: true };
    req.organization = { id: 'org-1', billingPolicy: 'ON_SUBMISSION' };
    next();
});

// Mock Rate Limiters to disable them
jest.mock('../src/middleware/rateLimiter', () => ({
    apiLimiter: (req, res, next) => next(),
    messageSendLimiter: (req, res, next) => next()
}));

// Mock SecurityService
jest.mock('../src/services/securityService', () => ({
    validateRequest: jest.fn().mockResolvedValue({ valid: true })
}));

// Mock the queue
jest.mock('../src/queue/messageQueue', () => ({
    add: jest.fn().mockResolvedValue({})
}));

describe('Message Submission API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject submission without required fields', async () => {
        const res = await request(app)
            .post('/api/messages')
            .send({}); // Missing recipient and content

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
    });

    it('should accept a valid message and return 202', async () => {
        const mockMessage = { id: 'msg-123', status: 'queued' };
        prisma.message.create.mockResolvedValue(mockMessage);

        const res = await request(app)
            .post('/api/messages')
            .send({
                recipient: '1234567890',
                content: 'Hello World'
            });

        expect(res.status).toBe(202);
        expect(res.body.status).toBe('success');
        expect(prisma.message.create).toHaveBeenCalled();
    });
});
