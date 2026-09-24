const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const geoip = require('geoip-lite');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class SecurityService {
    /**
   * Checks if a login is restricted based on organization country rules.
   */
    async checkLoginRestricted(organizationId, remoteIp) {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { allowedCountries: true }
        });

        if (
            !organization ||
      !organization.allowedCountries ||
      organization.allowedCountries.length === 0
        ) {
            return { restricted: false };
        }

        const geo = geoip.lookup(remoteIp);
        const country = geo ? geo.country : null;

        if (!country || !organization.allowedCountries.includes(country)) {
            return {
                restricted: true,
                reason: 'COUNTRY_NOT_ALLOWED',
                detectedCountry: country || 'Unknown'
            };
        }

        return { restricted: false };
    }

    /**
   * Generates a 2FA secret and placeholder QR code URL.
   */
    async generate2FASecret(userId, email) {
        const secret = speakeasy.generateSecret({
            name: `MsgSync:${email}`
        });

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 }
        });

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        return { secret: secret.base32, qrCodeUrl };
    }

    /**
   * Verifies a 2FA token before enabling.
   */
    async verify2FAPreSetup(secret, token) {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
        });
    }

    async enable2FA(userId, secret, token) {
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
        });

        if (verified) {
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true }
            });
            return true;
        }
        return false;
    }

    async verify2FA(userId, token) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true }
        });

        if (!user || !user.twoFactorEnabled) return true;

        return speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });
    }

    /**
   * Checks if a message request is valid based on security rules.
   */
    async validateRequest(apiKey, organization, recipient, content, remoteIp) {
    // 1. IP Whitelisting
        if (apiKey.allowedIps && apiKey.allowedIps.length > 0) {
            if (!apiKey.allowedIps.includes(remoteIp)) {
                return { valid: false, reason: 'IP_NOT_ALLOWED' };
            }
        }

        // 2. Spending Limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const spentToday = await prisma.transaction.aggregate({
            where: {
                organizationId: organization.id,
                type: 'DEBIT',
                createdAt: { gte: today }
            },
            _sum: { amount: true }
        });

        const totalSpent = spentToday._sum.amount || 0;
        if (parseFloat(totalSpent) >= parseFloat(organization.maxDailySpend)) {
            return { valid: false, reason: 'DAILY_SPEND_LIMIT_REACHED' };
        }

        // 3. Simple Spam/Fraud Detection
        const isSpam = this.checkForSpam(content);
        if (isSpam) {
            return { valid: false, reason: 'CONTENT_REJECTED_SPAM' };
        }

        return { valid: true };
    }

    /**
   * Basic pattern matching for spam/phishing keywords.
   */
    checkForSpam(content) {
        const blacklist = [
            'lottery',
            'inheritance',
            'bank account suspended',
            'click here to claim',
            'urgent action required',
            'unusual activity detected',
            'verify your identity now'
        ];

        const lowerContent = content.toLowerCase();
        return blacklist.some((term) => lowerContent.includes(term));
    }

    async updateOrganizationSecurity(orgId, data) {
        return await prisma.organization.update({
            where: { id: orgId },
            data: {
                maxDailySpend: data.maxDailySpend,
                allowedCountries: data.allowedCountries
            }
        });
    }

    async updateApiKeySecurity(keyId, data) {
        return await prisma.apiKey.update({
            where: { id: keyId },
            data: {
                allowedIps: data.allowedIps,
                rateLimit: data.rateLimit
            }
        });
    }

    async logSecurityEvent(
        userId,
        organizationId,
        action,
        metadata = {},
        ipAddress = null
    ) {
        return await prisma.auditLog.create({
            data: {
                action,
                entity: 'Security',
                entityId: userId || organizationId,
                userId,
                organizationId,
                metadata,
                ipAddress
            }
        });
    }
}

module.exports = new SecurityService();
