const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BundleService {
    async createBundle(data) {
        return await prisma.bundle.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                smsLimit: data.smsLimit,
                validityDays: data.validityDays,
                smsType: data.smsType || 'ALL',
                senderIdType: data.senderIdType || 'ALL',
                active: data.active !== undefined ? data.active : true
            }
        });
    }

    async updateBundle(id, data) {
        return await prisma.bundle.update({
            where: { id },
            data
        });
    }

    async deleteBundle(id) {
    // We usually deactivate instead of delete for history
        return await prisma.bundle.update({
            where: { id },
            data: { active: false }
        });
    }

    async listBundles(includeInactive = false) {
        const where = includeInactive ? {} : { active: true };
        return await prisma.bundle.findMany({ where });
    }

    async subscribe(organizationId, bundleId) {
        return await prisma.$transaction(async (tx) => {
            const bundle = await tx.bundle.findUnique({ where: { id: bundleId } });
            if (!bundle) throw new Error('Bundle not found');
            if (!bundle.active) throw new Error('Bundle is not active');

            const org = await tx.organization.findUnique({
                where: { id: organizationId }
            });
            if (!org) throw new Error('Organization not found');

            if (parseFloat(org.balance) < parseFloat(bundle.price)) {
                throw new Error('Insufficient balance to subscribe to this bundle');
            }

            // Deduct balance
            await tx.organization.update({
                where: { id: organizationId },
                data: { balance: { decrement: bundle.price } }
            });

            // Create Transaction record
            await tx.transaction.create({
                data: {
                    organizationId,
                    amount: bundle.price,
                    type: 'DEBIT',
                    description: `Subscription to ${bundle.name} bundle`,
                    status: 'COMPLETED'
                }
            });

            // Create Subscription
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + bundle.validityDays);

            return await tx.bundleSubscription.create({
                data: {
                    organizationId,
                    bundleId,
                    smsRemaining: bundle.smsLimit,
                    expiresAt,
                    status: 'ACTIVE'
                }
            });
        });
    }

    async getActiveSubscriptions(organizationId) {
        return await prisma.bundleSubscription.findMany({
            where: {
                organizationId,
                status: 'ACTIVE',
                expiresAt: { gt: new Date() }
            },
            include: { bundle: true }
        });
    }

    async getSubscriptionHistory(organizationId) {
        return await prisma.bundleSubscription.findMany({
            where: { organizationId },
            include: { bundle: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}

module.exports = new BundleService();
