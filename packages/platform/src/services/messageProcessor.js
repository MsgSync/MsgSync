const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const providerService = require('./providerService');

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

        if (message.status === 'paused') {
            console.log(`Message ${messageId} is paused, skipping.`);
            return;
        }

        if (['sent', 'delivered'].includes(message.status)) {
            console.log(`Message ${messageId} already ${message.status}, skipping.`);
            return;
        }

        const rateService = require('./rateService');
        const lookupService = require('./lookupService');
        const organizationService = require('./organizationService');

        const org = await prisma.organization.findUnique({
            where: { id: message.organizationId },
            select: {
                id: true,
                billingPolicy: true,
                type: true,
                balance: true,
                maxDailySpend: true
            }
        });

        const billingPolicy = org ? org.billingPolicy : 'ON_SUBMISSION';
        const isBillable = Boolean(org) && org.type !== 'ADMIN';

        // Determine profile from metadata or default to TRANSACTIONAL
        const messageProfile = message.metadata?.profile || 'TRANSACTIONAL';

        // Try to get HLR/MNP info for network-level granularity
        const lookupInfo = await lookupService.performLookup(message.recipient).catch(() => null);

        const rate = await rateService.lookupRateForOrganization(
            message.organizationId,
            message.recipient,
            lookupInfo?.mcc,
            lookupInfo?.mnc,
            messageProfile
        );

        if (isBillable) {
            const securityService = require('./securityService');
            if (await securityService.isDailySpendLimitReached(org)) {
                const rejected = await prisma.message.update({
                    where: { id: messageId },
                    data: {
                        status: 'failed',
                        error: 'DAILY_SPEND_LIMIT_REACHED',
                        price: 0,
                        cost: 0
                    }
                });
                const webhookService = require('./webhookService');
                await webhookService.triggerStatusChange(rejected);
                return { success: false, error: 'DAILY_SPEND_LIMIT_REACHED' };
            }
        }

        // 2. Prepaid balance check before attempting delivery
        if (isBillable && parseFloat(org.balance) < parseFloat(rate.pricePerSms)) {
            const rejected = await prisma.message.update({
                where: { id: messageId },
                data: {
                    status: 'failed',
                    error: 'Insufficient balance',
                    profile: messageProfile,
                    price: 0,
                    cost: 0
                }
            });
            const webhookService = require('./webhookService');
            await webhookService.triggerStatusChange(rejected);
            return { success: false, error: 'Insufficient balance' };
        }

        // 3. Update status to 'sending'
        await prisma.message.update({
            where: { id: messageId },
            data: { status: 'sending' }
        });

        // 4. Attempt delivery with intelligent failover
        const deliveryResult = await providerService.deliverWithFailover(message);

        // Find the provider used to get our internal cost
        const providerUsed = await prisma.provider.findFirst({
            where: { name: deliveryResult.providerUsed || '' }
        });
        const providerCost = providerUsed ? providerUsed.costPerSms : 0.005;

        // Billing Selection Logic:
        // ON_ATTEMPT: Always charge if we tried sending
        // ON_SUBMISSION: Only charge if provider accepted (deliveryResult.success)
        // ON_DELIVERY: Charged when a delivery receipt arrives (see deliveryReceiptService)
        let finalPrice = 0;
        if (billingPolicy === 'ON_DELIVERY') {
            finalPrice = 0;
        } else if (billingPolicy === 'ON_ATTEMPT') {
            finalPrice = rate.pricePerSms;
        } else if (deliveryResult.success) {
            finalPrice = rate.pricePerSms;
        }

        if (isBillable && finalPrice > 0) {
            try {
                await organizationService.updateBalance(
                    message.organizationId,
                    Number(finalPrice),
                    'DEBIT',
                    `SMS to ${message.recipient} (${message.id})`
                );
            } catch (billingError) {
                console.error(`Failed to debit balance for message ${messageId}:`, billingError);
            }
        }

        // 5. Update message with result and financials
        const aiService = require('./aiService');
        const sentimentResult = await aiService.analyzeSentiment(message.content);

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                ...(message.metadata?.otp && deliveryResult.success
                    ? { content: 'Verification code redacted' }
                    : {}),
                status: deliveryResult.success ? 'sent' : 'failed',
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
            await integrationService.sendSlackAlert(
                updatedMessage.metadata.slack_webhook_url,
                updatedMessage
            );
        }

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
