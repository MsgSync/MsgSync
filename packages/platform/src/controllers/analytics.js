const analyticsService = require('../services/analyticsService');

exports.getStats = async (req, res) => {
  try {
    const apiKeyId = req.apiKey ? req.apiKey.id : null;
    const organizationId = req.organization ? req.organization.id : null;
    const stats = await analyticsService.getMessageStats(apiKeyId, organizationId);
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const organizationId = req.organization ? req.organization.id : null;
    const data = await analyticsService.getVolumeTrend(organizationId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getVolumeByProvider = async (req, res) => {
  try {
    const organizationId = req.organization ? req.organization.id : null;
    const data = await analyticsService.getVolumeByProvider(organizationId);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const data = await analyticsService.getDetailedReports({}, 0, 50);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getLiveTraffic = async (req, res) => {
  try {
    const organizationId = req.organization ? req.organization.id : null;
    const limit = parseInt(req.query.limit) || 100;
    const data = await analyticsService.getLiveTraffic(organizationId, limit);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getFinancials = async (req, res) => {
  try {
    const organizationId = req.organization ? req.organization.id : null;
    const financials = await analyticsService.getFinancialStats(organizationId);
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
    res.status(201).json({ status: 'success', data: { id: `webhook-${Date.now()}`, ...req.body } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
