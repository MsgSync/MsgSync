const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const providerService = require('./providerService');
const { trackMessage } = require('../middleware/prom');

/**
 * Processes a message from the queue and attempts delivery through a provider.
 * @param {string} messageId - The ID of the message to process.
 */
async function processMessage(messageId) {
    try {
        // 1. Fetch message from DB
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            throw new Error(`Message ${messageId} not found`);
        }

        if (message.status === 'cancelled') {
            console.log(`Message ${messageId} was cancelled, skipping.`);
            return;
        }

        // 2. Update status to 'sending'
        await prisma.message.update({
            where: { id: messageId },
            data: { status: 'sending' }
        });

        // 3. Attempt delivery with intelligent failover
        const deliveryResult = await providerService.deliverWithFailover(message);

        // 4. Calculate Financials (Multi-Policy Billing Logic)
        const rateService = require('./rateService');
        const lookupService = require('./lookupService');

        const org = await prisma.organization.findUnique({
            where: { id: message.organizationId },
            select: { billingPolicy: true }
        });

        // Determine profile from metadata or default to TRANSACTIONAL
        const messageProfile = message.metadata?.profile || 'TRANSACTIONAL';

        // Try to get HLR/MNP info for network-level granularity
        const lookupInfo = await lookupService.getLookupInfo(message.recipient).catch(() => null);

        const rate = await rateService.lookupRateForOrganization(
            message.organizationId,
            message.recipient,
            lookupInfo?.mcc,
            lookupInfo?.mnc,
            messageProfile
        );

        // Find the provider used to get our internal cost
        const providerUsed = await prisma.provider.findFirst({ where: { name: deliveryResult.providerUsed || '' } });
        const providerCost = providerUsed ? providerUsed.costPerSms : 0.005;

        // Billing Selection Logic:
        // ON_ATTEMPT: Always charge if we tried sending
        // ON_SUBMISSION: Only charge if provider accepted (deliveryResult.success)
        // ON_DELIVERY: Charged via DLR webhook (handled in callbacks controller)
        let finalPrice = 0;
        if (org.billingPolicy === 'ON_ATTEMPT') {
            finalPrice = rate.pricePerSms;
        } else if (org.billingPolicy === 'ON_SUBMISSION' && deliveryResult.success) {
            finalPrice = rate.pricePerSms;
        }
        // If ON_DELIVERY, finalPrice remains 0 here; it will be charged in the DLR callback.

        // 5. Update message with result and financials
        const aiService = require('./aiService');
        const sentimentResult = await aiService.analyzeSentiment(message.content);

        // --- NEW: Atomic Balance Deduction & Transaction Logging ---
        const finalStatus = deliveryResult.success ? 'sent' : 'failed';
        let transaction = null;

        if (finalPrice > 0) {
            await prisma.$transaction(async (tx) => {
                // Deduct from organization balance
                await tx.organization.update({
                    where: { id: message.organizationId },
                    data: { balance: { decrement: finalPrice } }
                });

                // Create Transaction record
                transaction = await tx.transaction.create({
                    data: {
                        amount: finalPrice,
                        type: 'DEBIT',
                        currency: 'USD',
                        status: 'COMPLETED',
                        description: `SMS to ${message.recipient} | ID: ${message.id}`,
                        organizationId: message.organizationId
                    }
                });
            });
        }

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                status: finalStatus,
                externalId: deliveryResult.externalId,
                provider: deliveryResult.providerUsed || 'none',
                error: deliveryResult.error,
                profile: messageProfile,
                sentAt: deliveryResult.success ? new Date() : null,
                cost: deliveryResult.success ? providerCost : 0,
                price: finalPrice,
                sentiment: sentimentResult.sentiment,
                sentimentScore: sentimentResult.score
            }
        });

        // 6. Trigger webhook notification
        const webhookService = require('./webhookService');
        await webhookService.triggerStatusChange(updatedMessage);

        // 7. Trigger Integration Alerts (Slack/Discord)
        if (updatedMessage.status === 'failed' && updatedMessage.metadata?.slack_webhook_url) {
            const integrationService = require('./integrationService');
            await integrationService.sendSlackAlert(updatedMessage.metadata.slack_webhook_url, updatedMessage);
        }

        // Track metric
        trackMessage(updatedMessage.status, updatedMessage.provider || 'none');

        return deliveryResult;
    } catch (error) {
        console.error(`Error in processMessage for ${messageId}:`, error);

        // Final attempt to record the error in the DB
        try {
            await prisma.message.update({
                where: { id: messageId },
                data: {
                    status: 'failed',
                    error: error.message
                }
            });
        } catch (dbError) {
            console.error('Failed to update error status in DB:', dbError);
        }

        throw error;
    }
}

module.exports = {
    processMessage
};
