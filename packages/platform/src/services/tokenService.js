const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class TokenService {
    hash(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    async issue(userId) {
        const token = crypto.randomBytes(48).toString('base64url');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await prisma.refreshToken.create({
            data: { tokenHash: this.hash(token), userId, expiresAt }
        });

        return { token, expiresAt };
    }

    async rotate(token) {
        const tokenHash = this.hash(token);
        const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

        if (!record || record.revokedAt || record.expiresAt < new Date()) {
            if (record?.userId) {
                await this.revokeAllForUser(record.userId, 'TOKEN_REUSE_DETECTED');
            }
            return null;
        }

        const replacement = await prisma.$transaction(async (tx) => {
            await tx.refreshToken.update({
                where: { id: record.id },
                data: { revokedAt: new Date() }
            });
            const next = crypto.randomBytes(48).toString('base64url');
            const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
            await tx.refreshToken.create({
                data: { tokenHash: this.hash(next), userId: record.userId, expiresAt }
            });
            return { token: next, expiresAt };
        });

        return replacement;
    }

    async revoke(token) {
        await prisma.refreshToken.updateMany({
            where: { tokenHash: this.hash(token), revokedAt: null },
            data: { revokedAt: new Date() }
        });
    }

    async revokeAllForUser(userId, reason = null) {
        await prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        });
        if (reason) {
            const auditService = require('./auditService');
            await auditService.log({
                action: 'REVOKE_ALL_SESSIONS',
                entity: 'User',
                entityId: userId,
                organizationId: null,
                metadata: { reason }
            });
        }
    }

    async purgeExpired() {
        return await prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } }
        });
    }
}

module.exports = new TokenService();
