const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Service to aggregate platform-wide analytics.
 */
class AnalyticsService {
    async getMessageStats(apiKeyId = null, organizationId = null) {
        const where = {};
        if (apiKeyId) where.apiKeyId = apiKeyId;
        if (organizationId) where.organizationId = organizationId;

        const totalMessages = await prisma.message.count({ where });

        const statusCounts = await prisma.message.groupBy({
            by: ['status'],
            where,
            _count: {
                _all: true
            }
        });

        // Format into a friendly object
        const stats = {
            total: totalMessages,
            sent: 0,
            failed: 0,
            queued: 0,
            sending: 0,
            delivered: 0
        };

        statusCounts.forEach((item) => {
            stats[item.status] = item._count._all;
        });

        // Calculate success rate
        const finished = stats.sent + stats.failed + stats.delivered;
        stats.successRate =
      finished > 0
          ? (((stats.sent + stats.delivered) / finished) * 100).toFixed(1)
          : 0;

        return stats;
    }

    /**
   * Gets delivery volume trends over the last 24 hours.
   */
    async getVolumeTrend(apiKeyId = null, organizationId = null) {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const where = {
            createdAt: { gte: last24h }
        };
        if (apiKeyId) where.apiKeyId = apiKeyId;
        if (organizationId) where.organizationId = organizationId;

        // Simplified: group by hour
        const messages = await prisma.message.findMany({
            where,
            select: { createdAt: true, status: true }
        });

        const hourlyData = {};
        for (let i = 0; i < 24; i++) {
            const hour = new Date(Date.now() - i * 60 * 60 * 1000).getHours();
            hourlyData[hour] = { count: 0, success: 0 };
        }

        messages.forEach((m) => {
            const h = m.createdAt.getHours();
            if (hourlyData[h]) {
                hourlyData[h].count++;
                if (m.status === 'sent' || m.status === 'delivered')
                    hourlyData[h].success++;
            }
        });

        return Object.entries(hourlyData)
            .map(([hour, data]) => ({
                hour: parseInt(hour),
                ...data
            }))
            .sort((a, b) => a.hour - b.hour);
    }
    /**
   * Gets message volume by provider.
   */
    async getVolumeByProvider(apiKeyId = null, organizationId = null) {
        const where = {};
        if (apiKeyId) where.apiKeyId = apiKeyId;
        if (organizationId) where.organizationId = organizationId;

        const volumeByProvider = await prisma.message.groupBy({
            by: ['provider'],
            where,
            _count: {
                _all: true
            }
        });

        return volumeByProvider.map(item => ({
            provider: item.provider || 'unknown',
            count: item._count._all
        }));
    }

    async getFinancialStats(organizationId = null) {
        const where = {
            status: { in: ['sent', 'delivered'] }
        };
        if (organizationId) where.organizationId = organizationId;

        const summary = await prisma.message.aggregate({
            where,
            _sum: {
                cost: true,
                price: true
            },
            _count: {
                _all: true
            }
        });

        const revenue = parseFloat(summary._sum.price || 0);
        const cost = parseFloat(summary._sum.cost || 0);
        const profit = revenue - cost;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

        // Get breakdown by profile
        const profileBreakdown = await prisma.message.groupBy({
            by: ['profile'],
            where,
            _sum: {
                price: true
            }
        });

        return {
            revenue,
            cost,
            profit,
            margin,
            messageCount: summary._count._all,
            profileBreakdown: profileBreakdown.map((p) => ({
                profile: p.profile,
                revenue: parseFloat(p._sum.price || 0)
            }))
        };
    }

    /**
   * Gets detailed message reports with pagination and filtering.
   */
    async getDetailedReports(filters = {}, skip = 0, take = 50) {
        const where = {};
        if (filters.organizationId) where.organizationId = filters.organizationId;
        if (filters.status) where.status = filters.status;
        if (filters.profile) where.profile = filters.profile;
        if (filters.startDate && filters.endDate) {
            where.createdAt = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
            };
        }

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    apiKey: { select: { name: true } }
                }
            }),
            prisma.message.count({ where })
        ]);

        return { messages, total };
    }

    /**
   * Gets recent messages for real-time traffic monitoring.
   */
    async getLiveTraffic(organizationId = null, limit = 100) {
        const where = {};
        if (organizationId) where.organizationId = organizationId;

        return await prisma.message.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                recipient: true,
                status: true,
                provider: true,
                createdAt: true,
                cost: true,
                price: true,
                sentiment: true
            }
        });
    }

    /**
   * Gets active alerts for an organization.
   */
    async getAlerts(organizationId) {
        return await prisma.alert.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
   * Creates or updates an alert.
   */
    async saveAlert(organizationId, alertData) {
        if (alertData.id) {
            return await prisma.alert.update({
                where: { id: alertData.id, organizationId },
                data: alertData
            });
        }
        return await prisma.alert.create({
            data: {
                ...alertData,
                organizationId
            }
        });
    }

    async deleteAlert(organizationId, alertId) {
        return await prisma.alert.delete({
            where: { id: alertId, organizationId }
        });
    }
}

module.exports = new AnalyticsService();
