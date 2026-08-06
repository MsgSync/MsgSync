const Queue = require('bull');
const dotenv = require('dotenv');

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const webhookQueue = new Queue('webhook-notifications', redisUrl, {
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000 // 5s, 10s, 20s...
        },
        removeOnComplete: true
    }
});

// Process webhooks
if (process.env.NODE_ENV !== 'test') {
    const axios = require('axios');
    const crypto = require('crypto');

    webhookQueue.process(async (job) => {
        const { url, payload, secret } = job.data;

        console.log(`Sending webhook notification to ${url}`);

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'MsgSync-Webhook/1.0'
        };

        if (secret) {
            const signature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');
            headers['X-MsgSync-Signature'] = signature;
        }

        await axios.post(url, payload, { headers, timeout: 5000 });
    });
}

module.exports = webhookQueue;
