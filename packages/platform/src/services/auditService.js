const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
    /**
   * Records a platform action for security and traceability.
   */
    async log(data) {
        try {
            return await prisma.auditLog.create({
                data: {
                    action: data.action,
                    entity: data.entity,
                    entityId: data.entityId,
                    userId: data.userId || null,
                    organizationId: data.organizationId,
                    metadata: data.metadata || {},
                    ipAddress: data.ipAddress || null
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }

    /**
   * Retrieves audit logs for an organization.
   */
    async getLogs(organizationId, limit = 50) {
        const filter =
      organizationId && organizationId !== 'ALL' ? { organizationId } : {};
        return await prisma.auditLog.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}

module.exports = new AuditService();
