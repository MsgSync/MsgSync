const lookupService = require('../services/lookupService');

exports.getLookup = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ error: 'Phone number is required' });

        const result = await lookupService.performLookup(phone);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listRecent = async (req, res) => {
    try {
        const list = await lookupService.listRecentLookups();
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getConfigs = async (req, res) => {
    try {
        const configs = await lookupService.getConfigs();
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveConfig = async (req, res) => {
    try {
        const config = await lookupService.saveConfig(req.body);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteConfig = async (req, res) => {
    try {
        await lookupService.deleteConfig(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.testConfig = async (req, res) => {
    try {
        const { config, phone } = req.body;
        const result = await lookupService.performExternalHlr(config, phone);
        if (result) {
            res.json(result);
        } else {
            res.status(400).json({ error: 'HLR Test failed. Check logs for details.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
