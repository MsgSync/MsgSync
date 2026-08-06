const bundleService = require('../services/bundleService');

exports.createBundle = async (req, res) => {
    try {
        const bundle = await bundleService.createBundle(req.body);
        res.status(201).json(bundle);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateBundle = async (req, res) => {
    try {
        const bundle = await bundleService.updateBundle(req.params.id, req.body);
        res.json(bundle);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.listBundles = async (req, res) => {
    try {
        const bundles = await bundleService.listBundles(
            req.query.includeInactive === 'true'
        );
        res.json(bundles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.subscribe = async (req, res) => {
    try {
        const { organizationId, bundleId } = req.body;
        const subscription = await bundleService.subscribe(
            organizationId,
            bundleId
        );
        res.status(201).json(subscription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getOrgSubscriptions = async (req, res) => {
    try {
        const history = await bundleService.getSubscriptionHistory(
            req.params.orgId
        );
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
