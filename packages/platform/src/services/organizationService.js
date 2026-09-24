const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class OrganizationService {
    async createOrganization(data) {
        return await prisma.organization.create({
            data: {
                name: data.name,
                type: data.type || 'CLIENT',
                parentId: data.parentId,
                balance: data.balance || 0
            }
        });
    }

    async getOrganization(id) {
        return await prisma.organization.findUnique({
            where: { id },
            include: {
                subOrgs: true,
                parent: true,
                apiKeys: true
            }
        });
    }

    async listSubOrganizations(parentId) {
        return await prisma.organization.findMany({
            where: { parentId },
            include: {
                _count: {
                    select: { messages: true, subOrgs: true }
                }
            }
        });
    }

    async updateBalance(organizationId, amount, type, description) {
        return await prisma.$transaction(async (tx) => {
            const org = await tx.organization.findUnique({
                where: { id: organizationId }
            });
            if (!org) throw new Error('Organization not found');

            const newBalance =
        type === 'CREDIT'
            ? parseFloat(org.balance) + parseFloat(amount)
            : parseFloat(org.balance) - parseFloat(amount);

            if (newBalance < 0) throw new Error('Insufficient balance');

            const updatedOrg = await tx.organization.update({
                where: { id: organizationId },
                data: { balance: newBalance }
            });

            await tx.transaction.create({
                data: {
                    organizationId,
                    amount,
                    type,
                    description,
                    status: 'COMPLETED'
                }
            });

            return updatedOrg;
        });
    }

    async getTransactions(organizationId) {
        return await prisma.transaction.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getReportingData(organizationId) {
    // Basic aggregation for dummy reporting
        const messages = await prisma.message.groupBy({
            by: ['status'],
            where: { organizationId },
            _count: true
        });

        const balance = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { balance: true }
        });

        return {
            stats: messages,
            balance: balance.balance
        };
    }
}

module.exports = new OrganizationService();
