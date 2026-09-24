const request = require('supertest');
const app = require('../src/index');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
    const mPrismaClient = {
        source: {
            findMany: jest
                .fn()
                .mockResolvedValue([
                    {
                        id: '1',
                        name: 'Test Source',
                        type: 'sms',
                        active: true,
                        config: { url: 'http://example.com' }
                    }
                ]),
            create: jest
                .fn()
                .mockImplementation((data) =>
                    Promise.resolve({ id: '2', ...data.data })
                )
        },
        message: {
            count: jest.fn().mockResolvedValue(10),
            groupBy: jest
                .fn()
                .mockResolvedValue([{ source: 'Test Source', _count: { _all: 5 } }])
        }
    };
    return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Aggregator API', () => {
    test('GET /health should return ok', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });

    test('GET /api/sources should return sources', async () => {
        const response = await request(app).get('/api/sources');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].name).toBe('Test Source');
    });

    test('POST /api/sources should create a source', async () => {
        const newSource = {
            name: 'New Source',
            type: 'webhook',
            config: { url: 'http://webhook.com' }
        };
        const response = await request(app).post('/api/sources').send(newSource);
        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.data.name).toBe('New Source');
    });

    test('GET /api/analytics should return summary', async () => {
        const response = await request(app).get('/api/analytics');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.totalMessages).toBe(10);
    });
});
