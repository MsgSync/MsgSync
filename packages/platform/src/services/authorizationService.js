const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ROLES } = require('../config/rbac');

async function getDescendantOrganizationIds(rootId) {
    const organizations = await prisma.organization.findMany({
        select: { id: true, parentId: true }
    });
    const childrenByParent = new Map();
    for (const organization of organizations) {
        if (!organization.parentId) continue;
        const children = childrenByParent.get(organization.parentId) || [];
        children.push(organization.id);
        childrenByParent.set(organization.parentId, children);
    }

    const descendants = [];
    const pending = [rootId];
    while (pending.length > 0) {
        const parentId = pending.shift();
        for (const childId of childrenByParent.get(parentId) || []) {
            if (!descendants.includes(childId)) {
                descendants.push(childId);
                pending.push(childId);
            }
        }
    }
    return descendants;
}

async function getOrganizationScope(req) {
    if (!req.organization?.id) return [];
    if (req.identityRole === ROLES.ADMIN) return null;
    if (req.identityRole === ROLES.CUSTOMER) return [req.organization.id];
    return [req.organization.id, ...(await getDescendantOrganizationIds(req.organization.id))];
}

async function canAccessOrganization(req, organizationId) {
    if (!organizationId) return false;
    const scope = await getOrganizationScope(req);
    return scope === null || scope.includes(organizationId);
}

async function requireOrganizationAccess(req, organizationId) {
    if (!(await canAccessOrganization(req, organizationId))) {
        const error = new Error('Organization is outside your authorized scope.');
        error.status = 403;
        throw error;
    }
    return organizationId;
}

function organizationScopeWhere(scope, field = 'organizationId') {
    if (scope === null) return {};
    return { [field]: { in: scope } };
}

module.exports = {
    getDescendantOrganizationIds,
    getOrganizationScope,
    canAccessOrganization,
    requireOrganizationAccess,
    organizationScopeWhere
};
