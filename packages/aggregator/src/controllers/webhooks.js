const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { normalizeMessage } = require('../services/aggregator');
const syncService = require('../services/syncService');

/**
 * Controller to handle incoming webhooks from external sources (Slack, Discord, custom).
 */
async function handleWebhook(req, res) {
    const { source } = req.params;
    const rawPayload = req.body;

    console.log(`Received webhook from source: ${source}`);

    try {
        // 1. Normalize the message based on source
        const normalized = normalizeMessage(rawPayload, source, 'webhook');

        // 2. Save to Aggregator Database
        const savedMessage = await prisma.message.create({
            data: {
                ...normalized,
                status: 'processed'
            }
        });

        // 3. Sync to Platform (Optional, can be triggered by background job)
        // For this demo, we'll sync immediately
        await syncService.syncToPlatform(savedMessage);

        res.status(200).json({
            status: 'success',
            message: 'Webhook processed and synced to platform'
        });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    handleWebhook
};
