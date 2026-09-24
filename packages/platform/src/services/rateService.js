const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RateService {
    // --- Rate Plan Management ---

    async createRatePlan(data) {
        return await prisma.ratePlan.create({
            data: {
                name: data.name,
                description: data.description,
                currency: data.currency || 'USD',
                ownerId: data.ownerId,
                isPublic: data.isPublic || false
            }
        });
    }

    async listRatePlans(ownerId = null) {
        return await prisma.ratePlan.findMany({
            where: ownerId ? { ownerId } : { isPublic: true },
            include: { _count: { select: { rates: true } } }
        });
    }

    async assignPlanToOrganization(organizationId, planId) {
        return await prisma.organization.update({
            where: { id: organizationId },
            data: { ratePlanId: planId }
        });
    }

    // --- Rate Management ---

    async updateRate(planId, data) {
        const uniqueKey = {
            planId_prefix_mcc_mnc_profile: {
                planId,
                prefix: data.prefix,
                mcc: data.mcc || '',
                mnc: data.mnc || '',
                profile: data.profile || 'TRANSACTIONAL'
            }
        };

        return await prisma.rate.upsert({
            where: uniqueKey,
            update: {
                country: data.country,
                networkName: data.networkName,
                pricePerSms: data.pricePerSms,
                status: data.status || 'ACTIVE'
            },
            create: {
                planId,
                country: data.country,
                prefix: data.prefix,
                mcc: data.mcc || '',
                mnc: data.mnc || '',
                profile: data.profile || 'TRANSACTIONAL',
                networkName: data.networkName,
                pricePerSms: data.pricePerSms,
                status: data.status || 'ACTIVE'
            }
        });
    }

    /**
   * Optimized batch import for large price lists
   */
    async importRates(planId, rates) {
        return await prisma.$transaction(
            rates.map((r) =>
                prisma.rate.upsert({
                    where: {
                        planId_prefix_mcc_mnc_profile: {
                            planId,
                            prefix: r.prefix,
                            mcc: r.mcc || '',
                            mnc: r.mnc || '',
                            profile: r.profile || 'TRANSACTIONAL'
                        }
                    },
                    update: {
                        country: r.country,
                        networkName: r.networkName,
                        pricePerSms: r.pricePerSms,
                        status: 'ACTIVE'
                    },
                    create: {
                        planId,
                        country: r.country,
                        prefix: r.prefix,
                        mcc: r.mcc || '',
                        mnc: r.mnc || '',
                        profile: r.profile || 'TRANSACTIONAL',
                        networkName: r.networkName,
                        pricePerSms: r.pricePerSms,
                        status: 'ACTIVE'
                    }
                })
            )
        );
    }

    async getRatesForPlan(planId) {
        return await prisma.rate.findMany({
            where: { planId },
            orderBy: [{ country: 'asc' }, { prefix: 'asc' }, { profile: 'asc' }]
        });
    }

    /**
   * Intelligent Rate Lookup for Charging
   */
    async lookupRateForOrganization(
        organizationId,
        phone,
        mcc = null,
        mnc = null,
        profile = 'TRANSACTIONAL'
    ) {
        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { ratePlanId: true }
        });

        if (!org || !org.ratePlanId) {
            return { country: 'Default', pricePerSms: 0.05, prefix: '0', profile }; // High fallback safety
        }

        const cleanPhone = phone.replace('+', '');

        // Note: For extreme performance, this should use a Radix Tree or Redis cache
        const rates = await prisma.rate.findMany({
            where: { planId: org.ratePlanId, status: 'ACTIVE', profile: profile },
            orderBy: [{ pricePerSms: 'asc' }]
        });

        // 1. Try MCC/MNC match first
        if (mcc && mnc) {
            const netMatch = rates.find((r) => r.mcc === mcc && r.mnc === mnc);
            if (netMatch) return netMatch;
        }

        // 2. Prefix matching (Waterfall)
        const sortedRates = rates.sort((a, b) => b.prefix.length - a.prefix.length);
        const match = sortedRates.find((r) => cleanPhone.startsWith(r.prefix));

        return (
            match || {
                country: 'Unknown',
                pricePerSms: 0.1,
                prefix: 'default',
                profile
            }
        );
    }

    // --- Sender ID Management ---

    async registerSenderId(organizationId, name, type) {
        return await prisma.senderId.create({
            data: {
                organizationId,
                name,
                type: type || 'ALPHANUMERIC',
                status: 'PENDING'
            }
        });
    }

    async approveSenderId(id) {
        return await prisma.senderId.update({
            where: { id },
            data: { status: 'APPROVED' }
        });
    }

    async listSenderIds(organizationId) {
        return await prisma.senderId.findMany({
            where: { organizationId }
        });
    }
}

module.exports = new RateService();
