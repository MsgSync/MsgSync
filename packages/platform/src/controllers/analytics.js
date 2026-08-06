const analyticsService = require('../services/analyticsService');

/**
 * Gets message delivery statistics.
 */
async function getStats(req, res) {
    try {
    // Optionally filter by API Key if user is not an admin
        const apiKeyId = req.apiKey ? req.apiKey.id : null;
        const organizationId = req.organization ? req.organization.id : null;
        const stats = await analyticsService.getMessageStats(
            apiKeyId,
            organizationId
        );
        res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Gets message volume trends.
 */
async function getTrends(req, res) {
    try {
        const apiKeyId = req.apiKey ? req.apiKey.id : null;
        const organizationId = req.organization ? req.organization.id : null;
        const trends = await analyticsService.getVolumeTrend(
            apiKeyId,
            organizationId
        );
        res.status(200).json({ status: 'success', data: trends });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Gets message volume by provider.
 */
async function getVolumeByProvider(req, res) {
    try {
        const apiKeyId = req.apiKey ? req.apiKey.id : null;
        const organizationId = req.organization ? req.organization.id : null;
        const data = await analyticsService.getVolumeByProvider(
            apiKeyId,
            organizationId
        );
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Gets financial performance stats (revenue, cost, profit).
 */
async function getFinancials(req, res) {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        const financials = await analyticsService.getFinancialStats(organizationId);
        res.status(200).json({ status: 'success', data: financials });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Gets detailed message reports.
 */
async function getReports(req, res) {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        const { status, profile, startDate, endDate, skip, take } = req.query;
        const filters = { organizationId, status, profile, startDate, endDate };
        const data = await analyticsService.getDetailedReports(
            filters,
            parseInt(skip) || 0,
            parseInt(take) || 50
        );
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Gets live traffic.
 */
async function getLiveTraffic(req, res) {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        const data = await analyticsService.getLiveTraffic(organizationId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Gets alerts.
 */
async function getAlerts(req, res) {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        if (!organizationId)
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        const data = await analyticsService.getAlerts(organizationId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Saves an alert.
 */
async function saveAlert(req, res) {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        if (!organizationId)
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        const data = await analyticsService.saveAlert(organizationId, req.body);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Deletes an alert.
 */
async function deleteAlert(req, res) {
    try {
        const organizationId = req.organization ? req.organization.id : null;
        if (!organizationId)
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        await analyticsService.deleteAlert(organizationId, req.params.id);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    getStats,
    getTrends,
    getFinancials,
    getReports,
    getLiveTraffic,
    getAlerts,
    saveAlert,
    deleteAlert
};
