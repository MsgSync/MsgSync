const rateService = require('../services/rateService');

// --- Rate Plan Endpoints ---

exports.listPlans = async (req, res) => {
    try {
        const plans = await rateService.listRatePlans(req.query.ownerId);
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPlan = async (req, res) => {
    try {
        const plan = await rateService.createRatePlan(req.body);
        res.status(201).json(plan);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.assignPlan = async (req, res) => {
    try {
        const { organizationId, planId } = req.body;
        const result = await rateService.assignPlanToOrganization(
            organizationId,
            planId
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Rate Endpoints ---

exports.listRates = async (req, res) => {
    try {
        const planId = req.params.planId || req.query.planId;
        if (!planId) return res.status(400).json({ error: 'planId is required' });

        const rates = await rateService.getRatesForPlan(planId);
        res.json(rates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRate = async (req, res) => {
    try {
        const planId = req.params.planId || req.body.planId;
        const rate = await rateService.updateRate(planId, req.body);
        res.status(201).json(rate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.importRates = async (req, res) => {
    try {
        const { planId, rates } = req.body;
        const result = await rateService.importRates(planId, rates);
        res.json({ success: true, count: result.length });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.lookupExchange = async (req, res) => {
    try {
        const { phone, organizationId, mcc, mnc } = req.query;
        const info = await rateService.lookupRateForOrganization(
            organizationId,
            phone,
            mcc,
            mnc
        );
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Sender ID Endpoints ---

exports.requestSenderId = async (req, res) => {
    try {
        const { organizationId, name, type } = req.body;
        const sid = await rateService.registerSenderId(organizationId, name, type);
        res.status(201).json(sid);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getSenderIds = async (req, res) => {
    try {
        const list = await rateService.listSenderIds(req.params.orgId);
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveSenderId = async (req, res) => {
    try {
        const sid = await rateService.approveSenderId(req.params.id);
        res.json(sid);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
