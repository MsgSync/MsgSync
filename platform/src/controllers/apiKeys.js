const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const securityService = require('../services/securityService');

/**
 * Lists all API keys for the user's organization.
 */
async function listKeys(req, res) {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { organizationId: req.user.organizationId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ status: 'success', data: keys });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Creates a new API key.
 */
async function createKey(req, res) {
    try {
        const { name, monthlyQuota } = req.body;
        const key = await securityService.generateApiKey(req.user.organizationId, name, monthlyQuota);
        await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'CREATE_API_KEY', { name, keyId: key.id });
        res.status(201).json({ status: 'success', data: key });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Rotates an existing API key.
 */
async function rotateKey(req, res) {
    try {
        const { id } = req.params;

        // Verify ownership
        const existing = await prisma.apiKey.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== req.user.organizationId) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        const key = await securityService.rotateApiKey(id);
        await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'ROTATE_API_KEY', { keyId: id });
        res.status(200).json({ status: 'success', data: key });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Deletes an API key.
 */
async function deleteKey(req, res) {
    try {
        const { id } = req.params;

        // Verify ownership
        const existing = await prisma.apiKey.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== req.user.organizationId) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        await prisma.apiKey.delete({ where: { id } });
        await securityService.logSecurityEvent(req.user.id, req.user.organizationId, 'DELETE_API_KEY', { keyId: id });
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    listKeys,
    createKey,
    rotateKey,
    deleteKey
};
