const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STATUS_ALIASES = {
    delivered: 'delivered',
    delivrd: 'delivered',
    delivery_success: 'delivered',
    success: 'delivered',
    read: 'delivered',
    failed: 'failed',
    undelivered: 'failed',
    undeliv: 'failed',
    undeliverable: 'failed',
    rejected: 'failed',
    rejectd: 'failed',
    expired: 'failed',
    deleted: 'failed',
    error: 'failed',
    sent: 'sent',
    submitted: 'sent',
    accepted: 'sent',
    acceptd: 'sent'
};

class DeliveryReceiptService {
    /**
     * Maps a provider specific status to delivered, failed, sent or null (ignored).
     * @param {string} raw - provider status.
     * @param {Object} customMap - optional provider specific mapping.
     */
    normalizeStatus(raw, customMap = {}) {
        if (raw === undefined || raw === null) return null;
        const key = String(raw).trim().toLowerCase();
        const custom = Object.entries(customMap || {}).find(([from]) => from.toLowerCase() === key);
        if (custom) return ['delivered', 'failed', 'sent'].includes(custom[1]) ? custom[1] : null;
        return STATUS_ALIASES[key] || null;
    }

    /**
     * Applies a delivery receipt to the message identified by the provider's external id.
     * Receipts are idempotent: a message that is already delivered is never changed.
     * @returns {Promise<{applied: boolean, reason?: string, message?: Object}>}
     */
    async applyReceipt({ externalId, status, error = null, receivedAt = new Date() }) {
        if (!externalId || !['delivered', 'failed', 'sent'].includes(status)) {
            return { applied: false, reason: 'ignored' };
        }

        const message = await prisma.message.findUnique({ where: { externalId } });
        if (!message) return { applied: false, reason: 'not_found' };

        if (status === 'sent' && ['sent', 'delivered', 'failed'].includes(message.status)) {
            return { applied: false, reason: 'no_change', message };
        }

        const data = { status };
        if (status === 'delivered') {
            data.deliveredAt = receivedAt;
            data.error = null;
        } else if (status === 'failed') {
            data.error = error || 'Delivery failed';
        }

        const result = await prisma.message.updateMany({
            where: { id: message.id, status: { not: 'delivered' } },
            data
        });
        if (result.count === 0) return { applied: false, reason: 'already_delivered', message };

        const updated = await prisma.message.findUnique({ where: { id: message.id } });

        if (status === 'delivered') {
            await this.billOnDelivery(updated).catch((billingError) =>
                console.error(`Delivery billing failed for ${updated.id}:`, billingError)
            );
        }

        const webhookService = require('./webhookService');
        await webhookService.triggerStatusChange(updated);

        return { applied: true, message: updated };
    }

    async billOnDelivery(message) {
        if (!message.organizationId || parseFloat(message.price) > 0) return;

        const org = await prisma.organization.findUnique({
            where: { id: message.organizationId },
            select: { billingPolicy: true, type: true }
        });
        if (!org || org.billingPolicy !== 'ON_DELIVERY') return;

        const lookupService = require('./lookupService');
        const rateService = require('./rateService');
        const lookupInfo = await lookupService.performLookup(message.recipient).catch(() => null);
        const rate = await rateService.lookupRateForOrganization(
            message.organizationId,
            message.recipient,
            lookupInfo?.mcc,
            lookupInfo?.mnc,
            message.profile
        );
        const price = Number(rate.pricePerSms);

        await prisma.message.update({ where: { id: message.id }, data: { price } });

        if (org.type !== 'ADMIN' && price > 0) {
            const organizationService = require('./organizationService');
            await organizationService.updateBalance(
                message.organizationId,
                price,
                'DEBIT',
                `SMS to ${message.recipient} (${message.id})`
            );
        }
    }
}

module.exports = new DeliveryReceiptService();
