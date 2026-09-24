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
    async validateRequest(apiKey, organization, recipient, content, remoteIp, metadata = {}) {
    // 1. IP Whitelisting
        if (apiKey.allowedIps && apiKey.allowedIps.length > 0) {
            if (!apiKey.allowedIps.includes(remoteIp)) {
                return { valid: false, reason: 'IP_NOT_ALLOWED' };
            }
        }

        if (organization.suspended || parseFloat(organization.balance) <= 0) {
            return { valid: false, reason: 'BALANCE_EXHAUSTED' };
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

        const isSpam = this.checkForSpam(content);
        if (isSpam) return { valid: false, reason: 'CONTENT_REJECTED_SPAM' };

        const contentPolicy = this.applyContentPolicy(organization, content, { profile: metadata.profile || 'TRANSACTIONAL', senderId: metadata.senderId || metadata.sender });
        if (!contentPolicy.valid) return contentPolicy;
        content = contentPolicy.content;

        return { valid: true, content };
    }

    applyContentPolicy(organization, content, context = {}) {
        if (organization.contentScreeningEnabled === false) return { valid: true, content };
        const profile = context.profile || 'TRANSACTIONAL';
        const allowedProfiles = organization.allowedProfiles || ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP'];
        const allowedTypes = organization.allowedSmsTypes || allowedProfiles;
        if (allowedProfiles.length > 0 && !allowedProfiles.includes(profile)) return { valid: false, reason: 'PROFILE_NOT_ALLOWED' };
        if (allowedTypes.length > 0 && !allowedTypes.includes(profile)) return { valid: false, reason: 'SMS_TYPE_NOT_ALLOWED' };

        const senderId = context.senderId;
        if (senderId && (organization.allowedSenderIds || []).length > 0 && !organization.allowedSenderIds.includes(senderId)) return { valid: false, reason: 'SENDER_NOT_ALLOWED' };

        const blockedKeywords = organization.blockedKeywords || [];
        const matchedKeyword = blockedKeywords.find(keyword => content.toLowerCase().includes(String(keyword).toLowerCase()));
        if (matchedKeyword && !organization.modifyContentEnabled) return { valid: false, reason: 'CONTENT_REJECTED_KEYWORD' };
        let modifiedContent = matchedKeyword && organization.modifyContentEnabled ? content.replace(new RegExp(matchedKeyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'gi'), '[REDACTED]') : content;
        const blockedDomains = organization.blockedUrlDomains || [];
        const urlMatch = modifiedContent.match(/https?:\\/\\/[^\\s]+/gi) || [];
        if (urlMatch.some(url => blockedDomains.some(domain => url.toLowerCase().includes(String(domain).toLowerCase())))) return { valid: false, reason: 'CONTENT_REJECTED_URL' };
        return { valid: true, content: modifiedContent, modified: modifiedContent !== content };
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

    async getContentPolicy(organizationId) {
        return await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                contentScreeningEnabled: true,
                modifyContentEnabled: true,
                allowedProfiles: true,
                allowedSmsTypes: true,
                allowedSenderIds: true,
                blockedKeywords: true,
                blockedUrlDomains: true,
                modificationRules: true
            }
        });
    }

    async updateContentPolicy(organizationId, data) {
        return await prisma.organization.update({
            where: { id: organizationId },
            data: {
                contentScreeningEnabled: data.contentScreeningEnabled,
                modifyContentEnabled: data.modifyContentEnabled,
                allowedProfiles: data.allowedProfiles,
                allowedSmsTypes: data.allowedSmsTypes,
                allowedSenderIds: data.allowedSenderIds,
                blockedKeywords: data.blockedKeywords,
                blockedUrlDomains: data.blockedUrlDomains,
                modificationRules: data.modificationRules
            }
        });
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
