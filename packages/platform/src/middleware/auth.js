const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = new PrismaClient();
const { normalizeRole, permissionsForRole } = require('../config/rbac');

async function authenticate(req, res, next) {
    const apiKeyValue = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const credential = apiKeyValue || bearerToken;

    if (!credential) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required.'
        });
    }

    try {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key: credential },
            include: { organization: true }
        });

        if (apiKey?.active) {
            if (!apiKey.organization) {
                return res.status(403).json({
                    status: 'error',
                    message: 'API key is not assigned to an organization.'
                });
            }
            req.apiKey = apiKey;
            req.organization = apiKey.organization;
            req.identityRole = normalizeRole(null, apiKey.organization.type);
            req.permissions = permissionsForRole(req.identityRole);
            return next();
        }

        if (apiKeyValue) {
            return res.status(403).json({
                status: 'error',
                message: 'Invalid or inactive API key.'
            });
        }

        const decoded = jwt.verify(
            bearerToken,
            process.env.JWT_SECRET || 'msgsync-super-secret-key-change-in-production'
        );

        if (decoded.type === 'REFRESH' || decoded.type === '2FA_PENDING') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid access token.'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { organization: true }
        });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid access token.'
            });
        }

        req.user = user;
        req.organization = user.organization;
        req.apiKey = await prisma.apiKey.findFirst({
            where: { organizationId: user.organizationId, active: true }
        });
        if (!req.apiKey) {
            req.apiKey = await prisma.apiKey.create({
                data: {
                    key: `msg_live_${crypto.randomBytes(32).toString('hex')}`,
                    name: 'Operator Console',
                    organizationId: user.organizationId
                }
            });
        }
        req.identityRole = normalizeRole(user.role, user.organization.type);
        req.permissions = permissionsForRole(req.identityRole);
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired access token.'
            });
        }

        console.error('Auth Middleware Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during authentication.'
        });
    }
}

module.exports = authenticate;
