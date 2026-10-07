const express = require('express');
const dotenv = require('dotenv');
const { triggerAggregation, getSources, addSource, getAnalytics } = require('./controllers/api');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const crypto = require('crypto');

function safeEqual(a, b) {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function authenticate(req, res, next) {
    const provided = req.headers['x-aggregator-key'];
    const expected = process.env.AGGREGATOR_API_KEY;
    if (!expected || !safeEqual(provided, expected)) {
        return res.status(401).json({ status: 'error', message: 'Invalid or missing API key' });
    }
    next();
}

const { handleWebhook } = require('./controllers/webhooks');

// API Routes
app.post('/api/aggregate', authenticate, triggerAggregation);
app.get('/api/sources', authenticate, getSources);
app.post('/api/sources', authenticate, addSource);
app.get('/api/analytics', authenticate, getAnalytics);

// Webhook Receiver
app.post('/api/webhooks/:source', authenticate, handleWebhook);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`MsgSync Aggregator listening at http://localhost:${port}`);
    });
}

module.exports = app; // For testing
