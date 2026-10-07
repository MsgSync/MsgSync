const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
    normalizeOrganizationId(organizationId) {
        return !organizationId || organizationId === 'SYSTEM' ? null : organizationId;
    }

    async log(data) {
        try {
            return await prisma.auditLog.create({
                data: {
                    action: data.action,
                    entity: data.entity,
                    entityId: data.entityId,
                    userId: data.userId || null,
                    organizationId: this.normalizeOrganizationId(data.organizationId),
                    metadata: data.metadata || {},
                    ipAddress: data.ipAddress || null
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }

    /**
     * @param {string|string[]|null} organizationId - an id, a list of ids, 'SYSTEM' for
     * system-level entries, or null/'ALL' for no filter.
     */
    async getLogs(organizationId, limit = 50) {
        let filter = {};
        if (Array.isArray(organizationId)) {
            filter = { organizationId: { in: organizationId } };
        } else if (organizationId === 'SYSTEM') {
            filter = { organizationId: null };
        } else if (organizationId && organizationId !== 'ALL') {
            filter = { organizationId };
        }
        return await prisma.auditLog.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}

module.exports = new AuditService();
