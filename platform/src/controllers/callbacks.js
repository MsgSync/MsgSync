const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const webhookService = require('../services/webhookService');

/**
 * Handles Twilio Status Callbacks (DLRs)
 */
async function twilioCallback(req, res) {
    const { MessageSid, MessageStatus, ErrorCode } = req.body;

    try {
        // 1. Find message by external ID
        const message = await prisma.message.findUnique({
            where: { externalId: MessageSid },
            include: { organization: true }
        });

        if (!message) {
            return res.status(404).json({ status: 'error', message: 'Message not found' });
        }

        // 2. Map Twilio status to internal status
        let internalStatus = message.status;
        if (MessageStatus === 'delivered') internalStatus = 'delivered';
        else if (['failed', 'undelivered'].includes(MessageStatus)) internalStatus = 'failed';

        // 3. Handle ON_DELIVERY billing
        let priceToCharge = 0;
        if (message.organization.billingPolicy === 'ON_DELIVERY' && internalStatus === 'delivered' && Number(message.price) === 0) {
            // Need to lookup rate again or store it in message metadata during submission
            // For now, let's assume we store the 'potential price' in metadata or use rateService
            const rateService = require('../services/rateService');
            const rate = await rateService.lookupRateForOrganization(
                message.organizationId,
                message.recipient,
                null, null, // We could store mcc/mnc in metadata to avoid re-lookup
                message.profile
            );
            priceToCharge = rate.pricePerSms;
        }

        // 4. Update message and balance atomically if needed
        await prisma.$transaction(async (tx) => {
            const updateData = {
                status: internalStatus,
                error: ErrorCode || message.error,
                deliveredAt: internalStatus === 'delivered' ? new Date() : null
            };

            if (priceToCharge > 0) {
                updateData.price = priceToCharge;

                // Deduct balance
                await tx.organization.update({
                    where: { id: message.organizationId },
                    data: { balance: { decrement: priceToCharge } }
                });

                // Record Transaction
                await tx.transaction.create({
                    data: {
                        amount: priceToCharge,
                        type: 'DEBIT',
                        currency: 'USD',
                        status: 'COMPLETED',
                        description: `DLR Charge for SMS to ${message.recipient} | ID: ${message.id}`,
                        organizationId: message.organizationId
                    }
                });
            }

            const updated = await tx.message.update({
                where: { id: message.id },
                data: updateData
            });

            // 5. Trigger DLR forwarding to client
            await webhookService.triggerStatusChange(updated);
        });

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error in Twilio DLR callback:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    twilioCallback
};
