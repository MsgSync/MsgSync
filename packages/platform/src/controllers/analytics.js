const analyticsService = require('../services/analyticsService');
const { getOrganizationScope, canAccessOrganization } = require('../services/authorizationService');

exports.getStats = async (req, res) => {
    try {
        const scope = await getOrganizationScope(req);
        const stats = await analyticsService.getMessageStats(null, scope);
        res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getTrends = async (req, res) => {
    try {
        const scope = await getOrganizationScope(req);
        const data = await analyticsService.getVolumeTrend(null, scope);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getVolumeByProvider = async (req, res) => {
    try {
        const scope = await getOrganizationScope(req);
        const data = await analyticsService.getVolumeByProvider(null, scope);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        const { status, profile, startDate, endDate, organizationId } = req.query;
        const scope = await getOrganizationScope(req);
        let organizationFilter = scope;
        if (organizationId) {
            if (!(await canAccessOrganization(req, organizationId))) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Organization is outside your authorized scope.'
                });
            }
            organizationFilter = organizationId;
        }
        const skip = Math.max(0, parseInt(req.query.skip) || 0);
        const take = Math.min(200, Math.max(1, parseInt(req.query.take) || 50));
        const data = await analyticsService.getDetailedReports(
            { organizationId: organizationFilter, status, profile, startDate, endDate },
            skip,
            take
        );
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getLiveTraffic = async (req, res) => {
    try {
        const scope = await getOrganizationScope(req);
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
        const data = await analyticsService.getLiveTraffic(scope, limit);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getFinancials = async (req, res) => {
    try {
        const scope = await getOrganizationScope(req);
        const financials = await analyticsService.getFinancialStats(scope);
        res.status(200).json({ status: 'success', data: financials });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        const data = await analyticsService.getAlerts(organizationId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.saveAlert = async (req, res) => {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        const data = await analyticsService.saveAlert(organizationId, req.body);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteAlert = async (req, res) => {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        await analyticsService.deleteAlert(organizationId, req.params.id);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getQueueDepth = async (req, res) => {
    try {
        res.status(200).json({ status: 'success', data: { depth: 0, workers: 8, retries: 0 } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getWebhooks = async (req, res) => {
    try {
        res.status(200).json({ status: 'success', data: [] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createWebhook = async (req, res) => {
    try {
        res.status(201).json({
            status: 'success',
            data: { id: `webhook-${Date.now()}`, ...req.body }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
