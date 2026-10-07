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
                apiKeys: {
                    select: { id: true, name: true, active: true, createdAt: true }
                }
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

    parseAmount(amount) {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) {
            throw new Error('Amount must be a positive number');
        }
        return value;
    }

    async applyBalanceChange(tx, organizationId, value, type, description) {
        if (type === 'CREDIT') {
            await tx.organization.update({
                where: { id: organizationId },
                data: { balance: { increment: value } }
            });
        } else {
            const result = await tx.organization.updateMany({
                where: { id: organizationId, balance: { gte: value } },
                data: { balance: { decrement: value } }
            });
            if (result.count === 0) {
                const exists = await tx.organization.findUnique({
                    where: { id: organizationId },
                    select: { id: true }
                });
                throw new Error(exists ? 'Insufficient balance' : 'Organization not found');
            }
        }

        await tx.transaction.create({
            data: { organizationId, amount: value, type, description, status: 'COMPLETED' }
        });

        return await tx.organization.findUnique({ where: { id: organizationId } });
    }

    async updateBalance(organizationId, amount, type, description) {
        const value = this.parseAmount(amount);
        return await prisma.$transaction((tx) =>
            this.applyBalanceChange(tx, organizationId, value, type, description)
        );
    }

    async transferBalance(fromOrganizationId, toOrganizationId, amount, description) {
        const value = this.parseAmount(amount);
        if (fromOrganizationId === toOrganizationId) {
            throw new Error('Cannot transfer balance to the same organization');
        }
        return await prisma.$transaction(async (tx) => {
            await this.applyBalanceChange(
                tx,
                fromOrganizationId,
                value,
                'DEBIT',
                description || `Transfer to ${toOrganizationId}`
            );
            return await this.applyBalanceChange(
                tx,
                toOrganizationId,
                value,
                'CREDIT',
                description || `Transfer from ${fromOrganizationId}`
            );
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
