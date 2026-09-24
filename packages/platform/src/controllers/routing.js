const routingService = require('../services/routingService');
const { getOrganizationScope, canAccessOrganization } = require('../services/authorizationService');
const { ROLES } = require('../config/rbac');

function scopedRuleWhere(scope) {
    if (scope === null) return {};
    return { OR: [{ organizationId: null }, { organizationId: { in: scope } }] };
}

exports.listRules = async (req, res) => {
    try {
        const scope = await getOrganizationScope(req);
        const rules = await routingService.listRules(scopedRuleWhere(scope));
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRule = async (req, res) => {
    try {
        const organizationId = req.identityRole === ROLES.ADMIN
            ? req.body.organizationId || null
            : req.organization.id;
        const rule = await routingService.createRule({ ...req.body, organizationId });
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateRule = async (req, res) => {
    try {
        const existing = await routingService.getRule(req.params.id);
        if (!existing || (req.identityRole !== ROLES.ADMIN && !existing.organizationId) || (existing.organizationId && !(await canAccessOrganization(req, existing.organizationId)))) {
            return res.status(404).json({ error: 'Routing rule not found' });
        }
        const organizationId = req.identityRole === ROLES.ADMIN
            ? req.body.organizationId ?? existing.organizationId
            : req.organization.id;
        const rule = await routingService.updateRule(req.params.id, { ...req.body, organizationId });
        res.json(rule);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteRule = async (req, res) => {
    try {
        const existing = await routingService.getRule(req.params.id);
        if (!existing || (req.identityRole !== ROLES.ADMIN && !existing.organizationId) || (existing.organizationId && !(await canAccessOrganization(req, existing.organizationId)))) {
            return res.status(404).json({ error: 'Routing rule not found' });
        }
        await routingService.deleteRule(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.listProviders = async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const providers = await prisma.provider.findMany({
            where: { active: true },
            orderBy: { priority: 'asc' }
        });
        res.json(providers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
