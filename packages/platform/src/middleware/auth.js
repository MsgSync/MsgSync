const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

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
            req.apiKey = apiKey;
            req.organization = apiKey.organization;
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
