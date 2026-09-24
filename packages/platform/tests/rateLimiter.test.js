const {
    apiLimiter,
    messageSendLimiter
} = require('../src/middleware/rateLimiter');
const request = require('supertest');
const express = require('express');

describe('Rate Limiter Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    it('should apply global API limiter', async () => {
        app.get('/test', apiLimiter, (req, res) =>
            res.status(200).json({ ok: true })
        );

        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.headers).toHaveProperty('ratelimit-limit');
    });

    it('should apply stricter message send limiter', async () => {
        app.post('/send', messageSendLimiter, (req, res) =>
            res.status(200).json({ ok: true })
        );

        // Send multiple requests to trigger limit if possible (or just check headers)
        const response = await request(app).post('/send');
        expect(response.status).toBe(200);
        expect(response.headers).toHaveProperty('ratelimit-limit');
        expect(parseInt(response.headers['ratelimit-limit'])).toBe(10);
    });
});
