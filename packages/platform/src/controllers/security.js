const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const securityService = require('../services/securityService');

/**
 * Generates 2FA setup details.
 */
async function setup2FA(req, res) {
    try {
        const result = await securityService.generate2FASecret(
            req.user.id,
            req.user.email
        );
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Verifies and enables 2FA.
 */
async function enable2FA(req, res) {
    try {
        const { secret, token } = req.body;
        const success = await securityService.enable2FA(req.user.id, secret, token);
        if (success) {
            await securityService.logSecurityEvent(
                req.user.id,
                req.user.organizationId,
                'ENABLE_2FA'
            );
            res.status(200).json({ status: 'success' });
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid token' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Disables 2FA.
 */
async function disable2FA(req, res) {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { twoFactorEnabled: false, twoFactorSecret: null }
        });
        await securityService.logSecurityEvent(
            req.user.id,
            req.user.organizationId,
            'DISABLE_2FA'
        );
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Updates organization country restrictions.
 */
async function updateRestrictions(req, res) {
    try {
        const { allowedCountries, maxDailySpend } = req.body;
        await securityService.updateOrganizationSecurity(req.user.organizationId, {
            allowedCountries,
            maxDailySpend
        });
        await securityService.logSecurityEvent(
            null,
            req.user.organizationId,
            'UPDATE_SECURITY_POLICY',
            { allowedCountries, maxDailySpend }
        );
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    setup2FA,
    enable2FA,
    disable2FA,
    updateRestrictions
};
