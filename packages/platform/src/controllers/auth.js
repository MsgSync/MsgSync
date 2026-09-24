const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'msgsync-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { organization: true }
        });

        if (!user || !user.passwordHash) {
            await require('../services/securityService').logSecurityEvent(
                null,
                null,
                'LOGIN_FAILED_INVALID_CREDENTIALS',
                { email, ip: req.ip }
            );
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            await require('../services/securityService').logSecurityEvent(
                user.id,
                user.organizationId,
                'LOGIN_FAILED_INVALID_PASSWORD',
                { ip: req.ip }
            );
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        const securityService = require('../services/securityService');
        const remoteIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const restriction = await securityService.checkLoginRestricted(
            user.organizationId,
            remoteIp
        );

        if (restriction.restricted) {
            await securityService.logSecurityEvent(
                user.id,
                user.organizationId,
                'LOGIN_BLOCKED_COUNTRY',
                { restriction, remoteIp }
            );
            return res.status(403).json({
                status: 'error',
                message: `Access denied from ${restriction.detectedCountry}`,
                country: restriction.detectedCountry
            });
        }

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, orgId: user.organizationId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, type: 'REFRESH' },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        await securityService.logSecurityEvent(
            user.id,
            user.organizationId,
            'LOGIN_SUCCESS',
            { remoteIp }
        );

        res.json({
            status: 'success',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    organization: user.organization,
                    twoFactorEnabled: user.twoFactorEnabled
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { email, password, name, organizationName } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, password, and name are required'
            });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        let org = await prisma.organization.findFirst({ where: { type: 'ADMIN' } });
        if (!org) {
            org = await prisma.organization.create({
                data: { name: organizationName || 'Default Organization', type: 'ADMIN' }
            });
        }

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                organizationId: org.id
            },
            include: { organization: true }
        });

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, orgId: user.organizationId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, type: 'REFRESH' },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );

        res.status(201).json({
            status: 'success',
            data: { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, organization: user.organization } }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        if (token) {
            await require('../services/securityService').logSecurityEvent(
                req.userId || null,
                req.organization?.id || null,
                'LOGOUT',
                { ip: req.ip }
            );
        }

        res.json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ status: 'error', message: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        if (decoded.type !== 'REFRESH') {
            return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { organization: true }
        });

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'User not found' });
        }

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, orgId: user.organizationId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const newRefreshToken = jwt.sign(
            { userId: user.id, type: 'REFRESH' },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );

        res.json({
            status: 'success',
            data: { accessToken, refreshToken: newRefreshToken }
        });
    } catch (error) {
        res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token' });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { temp_token, code } = req.body;
        const decoded = jwt.verify(temp_token, JWT_SECRET);

        if (decoded.type !== '2FA_PENDING') {
            return res.status(401).json({ error: 'Invalid state' });
        }

        const securityService = require('../services/securityService');
        const isValid = await securityService.verify2FA(decoded.userId, code);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, orgId: user.organizationId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        const refreshToken = jwt.sign(
            { userId: user.id, type: 'REFRESH' },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );

        res.json({ status: 'success', data: { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, organization: user.organization } } });
    } catch (error) {
        res.status(401).json({ error: 'Invalid session or code' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'No token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { organization: true }
        });

        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Invalid session' });
    }
};

exports.ssoLogin = async (req, res) => {
    try {
        const { provider } = req.params;
        const { code } = req.query;

        if (!code) {
            const mockRedirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=ABC&redirect_uri=http://localhost:3000/api/auth/sso/${provider}/callback&response_type=code`;
            return res.redirect(mockRedirectUrl);
        }

        const mockUserInfo = {
            id: `sso_${provider}_12345`,
            email: 'admin@msgsync.com',
            name: 'Demo Admin',
            avatar: 'https://ui-avatars.com/api/?name=Demo+Admin'
        };

        let user = await prisma.user.findUnique({
            where: { email: mockUserInfo.email },
            include: { organization: true }
        });

        if (!user) {
            let org = await prisma.organization.findFirst({ where: { type: 'ADMIN' } });
            if (!org) {
                org = await prisma.organization.create({ data: { name: 'Default Admin Org', type: 'ADMIN' } });
            }
            user = await prisma.user.create({
                data: { email: mockUserInfo.email, name: mockUserInfo.name, ssoId: mockUserInfo.id, ssoProvider: provider, avatarUrl: mockUserInfo.avatar, organizationId: org.id },
                include: { organization: true }
            });
        }

        const securityService = require('../services/securityService');
        const remoteIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const restriction = await securityService.checkLoginRestricted(user.organizationId, remoteIp);

        if (restriction.restricted) {
            return res.status(403).json({ status: 'error', message: `Access denied from ${restriction.detectedCountry}` });
        }

        if (user.twoFactorEnabled) {
            const tfaToken = jwt.sign({ userId: user.id, type: '2FA_PENDING' }, JWT_SECRET, { expiresIn: '10m' });
            return res.json({ status: 'success', data: { requires2FA: true, tempToken: tfaToken } });
        }

        const accessToken = jwt.sign({ userId: user.id, email: user.email, orgId: user.organizationId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jwt.sign({ userId: user.id, type: 'REFRESH' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

        await securityService.logSecurityEvent(user.id, user.organizationId, 'LOGIN_SUCCESS', { remoteIp });

        res.json({ status: 'success', data: { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, organization: user.organization } } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
