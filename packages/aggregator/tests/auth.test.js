const request = require('supertest');
const app = require('../src/index');

describe('aggregator authentication', () => {
    const key = 'test-aggregator-key';

    beforeEach(() => {
        process.env.AGGREGATOR_API_KEY = key;
    });

    afterAll(() => {
        delete process.env.AGGREGATOR_API_KEY;
    });

    it('rejects requests without a key', async () => {
        const res = await request(app).get('/api/sources');
        expect(res.status).toBe(401);
    });

    it('rejects requests with a wrong key', async () => {
        const res = await request(app).get('/api/sources').set('X-Aggregator-Key', 'wrong');
        expect(res.status).toBe(401);
    });

    it('accepts requests with the correct key', async () => {
        const res = await request(app).get('/api/sources').set('X-Aggregator-Key', key);
        expect(res.status).not.toBe(401);
    });
});
