const Queue = require('bull');
const dotenv = require('dotenv');

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create the message delivery queue
const messageQueue = new Queue('message-delivery', redisUrl);

// Process the queue
// In a real application, this might be in a separate worker process
if (process.env.NODE_ENV !== 'test') {
    const { processMessage } = require('../services/messageProcessor');

    // We'll define the processor function separately
    messageQueue.process(async (job) => {
        const { messageId } = job.data;
        console.log(`Processing message: ${messageId}`);
        return await processMessage(messageId);
    });

    // Add retry logic
    messageQueue.on('failed', async (job, err) => {
        console.error(`Job failed for message ${job.data.messageId}:`, err.message);
        
        // Retry logic: retry up to 3 times with exponential backoff
        if (job.attemptsMade < 3) {
            console.log(`Retrying job for message ${job.data.messageId}. Attempt ${job.attemptsMade + 1}`);
            await job.retry();
        }
    });
}

module.exports = messageQueue;
