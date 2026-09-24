const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const { ROLES, permissionsForRole } = require('../config/rbac');
const { getOrganizationScope, canAccessOrganization } = require('../services/authorizationService');
const auditService = require('../services/auditService');

function roleForManagedUser(requesterRole, requestedRole) {
    if (requesterRole === ROLES.ADMIN) return requestedRole || ROLES.CUSTOMER;
    if (requesterRole === ROLES.AGGREGATOR) {
        return [ROLES.RESELLER, ROLES.CUSTOMER].includes(requestedRole) ? requestedRole : ROLES.CUSTOMER;
    }
    return ROLES.CUSTOMER;
}

exports.getMyAccess = async (req, res) => {
    res.json({
        status: 'success',
        data: {
            role: req.identityRole,
            organization: req.organization,
            permissions: req.permissions || permissionsForRole(req.identityRole)
        }
    });
};

exports.listCustomers = async (req, res) => {
    const scope = await getOrganizationScope(req);
    const where = scope === null ? {} : { id: { in: scope } };
    const customers = await prisma.organization.findMany({
        where,
        select: { id: true, name: true, type: true, parentId: true, balance: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });
    res.json({ status: 'success', data: customers });
};

exports.createCustomer = async (req, res) => {
    const { name, type = 'CUSTOMER', balance = 0 } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Customer name is required' });
    if (req.identityRole === ROLES.ADMIN && ![ROLES.AGGREGATOR, ROLES.RESELLER, ROLES.CUSTOMER].includes(type)) {
        return res.status(400).json({ status: 'error', message: 'Invalid customer type' });
    }
    if (req.identityRole === ROLES.AGGREGATOR && ![ROLES.RESELLER, ROLES.CUSTOMER].includes(type)) {
        return res.status(400).json({ status: 'error', message: 'Aggregators can only create resellers or customers' });
    }
    if (![ROLES.AGGREGATOR, ROLES.RESELLER].includes(req.identityRole) && req.identityRole !== ROLES.ADMIN) {
        return res.status(403).json({ status: 'error', message: 'Customer management is not allowed' });
    }

    const customer = await prisma.organization.create({
        data: {
            name,
            type,
            balance,
            parentId: req.identityRole === ROLES.ADMIN ? req.body.parentId || null : req.organization.id
        }
    });
    await auditService.log({
        action: 'CREATE_CUSTOMER',
        entity: 'Organization',
        entityId: customer.id,
        userId: req.user?.id,
        organizationId: customer.id,
        metadata: { name, type }
    });
    res.status(201).json({ status: 'success', data: customer });
};

exports.listUsers = async (req, res) => {
    const scope = await getOrganizationScope(req);
    const users = await prisma.user.findMany({
        where: scope === null ? {} : { organizationId: { in: scope } },
        select: { id: true, email: true, name: true, role: true, organizationId: true, twoFactorEnabled: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });
    res.json({ status: 'success', data: users });
};

exports.createUser = async (req, res) => {
    const { email, password, name, role, organizationId } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ status: 'error', message: 'Email, password, and name are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters' });
    }

    const targetOrganizationId = req.identityRole === ROLES.ADMIN
        ? organizationId || req.organization.id
        : req.organization.id;
    if (!(await canAccessOrganization(req, targetOrganizationId))) {
        return res.status(403).json({ status: 'error', message: 'Organization is outside your scope' });
    }
    if (await prisma.user.findUnique({ where: { email } })) {
        return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }

    const user = await prisma.user.create({
        data: {
            email,
            name,
            passwordHash: await bcrypt.hash(password, 12),
            role: roleForManagedUser(req.identityRole, role),
            organizationId: targetOrganizationId
        },
        select: { id: true, email: true, name: true, role: true, organizationId: true }
    });
    await auditService.log({
        action: 'CREATE_USER',
        entity: 'User',
        entityId: user.id,
        userId: req.user?.id,
        organizationId: targetOrganizationId,
        metadata: { email, role: user.role }
    });
    res.status(201).json({ status: 'success', data: user });
};

exports.updateUserRole = async (req, res) => {
    const { role } = req.body;
    if (![ROLES.AGGREGATOR, ROLES.RESELLER, ROLES.CUSTOMER].includes(role)) {
        return res.status(400).json({ status: 'error', message: 'Invalid role' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || !(await canAccessOrganization(req, user.organizationId))) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { role: roleForManagedUser(req.identityRole, role) },
        select: { id: true, email: true, name: true, role: true, organizationId: true }
    });
    res.json({ status: 'success', data: updated });
};

module.exports = {
    getMyAccess: exports.getMyAccess,
    listCustomers: exports.listCustomers,
    createCustomer: exports.createCustomer,
    listUsers: exports.listUsers,
    createUser: exports.createUser,
    updateUserRole: exports.updateUserRole
};
