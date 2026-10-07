const rateService = require('../services/rateService');
const {
    getOrganizationScope,
    requireOrganizationAccess
} = require('../services/authorizationService');
const { ROLES } = require('../config/rbac');

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function loadPlan(planId) {
    if (!planId) throw httpError(400, 'planId is required');
    const plan = await rateService.getPlan(planId);
    if (!plan) throw httpError(404, 'Rate plan not found');
    return plan;
}

async function assertPlanManage(req, planId) {
    const plan = await loadPlan(planId);
    if (req.identityRole === ROLES.ADMIN) return plan;
    const scope = (await getOrganizationScope(req)) || [];
    if (!plan.ownerId || !scope.includes(plan.ownerId)) {
        throw httpError(403, 'Rate plan is outside your authorized scope.');
    }
    return plan;
}

async function assertPlanRead(req, planId) {
    const plan = await loadPlan(planId);
    if (req.identityRole === ROLES.ADMIN || plan.isPublic) return plan;
    const scope = (await getOrganizationScope(req)) || [];
    const owned = plan.ownerId && scope.includes(plan.ownerId);
    const assigned = plan.organizations.some((org) => scope.includes(org.id));
    if (!owned && !assigned) {
        throw httpError(403, 'Rate plan is outside your authorized scope.');
    }
    return plan;
}

function handle(res, error, fallbackStatus) {
    res.status(error.status || fallbackStatus).json({ error: error.message });
}

// --- Rate Plan Endpoints ---

exports.listPlans = async (req, res) => {
    try {
        if (req.identityRole === ROLES.ADMIN) {
            return res.json(await rateService.listRatePlans(req.query.ownerId));
        }
        const scope = (await getOrganizationScope(req)) || [];
        if (req.query.ownerId) {
            await requireOrganizationAccess(req, req.query.ownerId);
            return res.json(await rateService.listRatePlans(req.query.ownerId));
        }
        res.json(await rateService.listRatePlansScoped(scope, req.organization.id));
    } catch (error) {
        handle(res, error, 500);
    }
};

exports.createPlan = async (req, res) => {
    try {
        const ownerId =
            req.identityRole === ROLES.ADMIN && req.body.ownerId
                ? req.body.ownerId
                : req.organization.id;
        const plan = await rateService.createRatePlan({ ...req.body, ownerId });
        res.status(201).json(plan);
    } catch (error) {
        handle(res, error, 400);
    }
};

exports.assignPlan = async (req, res) => {
    try {
        const { organizationId, planId } = req.body;
        await requireOrganizationAccess(req, organizationId);
        if (req.identityRole !== ROLES.ADMIN && organizationId === req.organization.id) {
            throw httpError(403, 'You cannot change your own rate plan.');
        }
        await assertPlanRead(req, planId);
        const result = await rateService.assignPlanToOrganization(organizationId, planId);
        res.json(result);
    } catch (error) {
        handle(res, error, 400);
    }
};

// --- Rate Endpoints ---

exports.listRates = async (req, res) => {
    try {
        const planId = req.params.planId || req.query.planId;
        await assertPlanRead(req, planId);
        const rates = await rateService.getRatesForPlan(planId);
        res.json(rates);
    } catch (error) {
        handle(res, error, 500);
    }
};

exports.updateRate = async (req, res) => {
    try {
        const planId = req.params.planId || req.body.planId;
        await assertPlanManage(req, planId);
        const rate = await rateService.updateRate(planId, req.body);
        res.status(201).json(rate);
    } catch (error) {
        handle(res, error, 400);
    }
};

exports.importRates = async (req, res) => {
    try {
        const { planId, rates } = req.body;
        await assertPlanManage(req, planId);
        if (!Array.isArray(rates)) throw httpError(400, 'rates must be an array');
        const result = await rateService.importRates(planId, rates);
        res.json({ success: true, count: result.length });
    } catch (error) {
        handle(res, error, 400);
    }
};

exports.lookupExchange = async (req, res) => {
    try {
        const { phone, mcc, mnc } = req.query;
        const organizationId = req.query.organizationId || req.organization.id;
        await requireOrganizationAccess(req, organizationId);
        const info = await rateService.lookupRateForOrganization(organizationId, phone, mcc, mnc);
        res.json(info);
    } catch (error) {
        handle(res, error, 500);
    }
};

// --- Sender ID Endpoints ---

exports.requestSenderId = async (req, res) => {
    try {
        const { name, type } = req.body;
        const organizationId = req.body.organizationId || req.organization.id;
        await requireOrganizationAccess(req, organizationId);
        const sid = await rateService.registerSenderId(organizationId, name, type);
        res.status(201).json(sid);
    } catch (error) {
        handle(res, error, 400);
    }
};

exports.getSenderIds = async (req, res) => {
    try {
        const orgId = req.params.orgId === 'root' ? req.organization.id : req.params.orgId;
        await requireOrganizationAccess(req, orgId);
        const list = await rateService.listSenderIds(orgId);
        res.json(list);
    } catch (error) {
        handle(res, error, 500);
    }
};

exports.approveSenderId = async (req, res) => {
    try {
        const existing = await rateService.getSenderId(req.params.id);
        if (!existing) throw httpError(404, 'Sender ID not found');
        await requireOrganizationAccess(req, existing.organizationId);
        if (req.identityRole !== ROLES.ADMIN && existing.organizationId === req.organization.id) {
            throw httpError(403, 'You cannot approve your own sender IDs.');
        }
        const sid = await rateService.approveSenderId(req.params.id);
        res.json(sid);
    } catch (error) {
        handle(res, error, 400);
    }
};
