const brandingService = require('../services/brandingService');
const { requireOrganizationAccess } = require('../services/authorizationService');

exports.getBranding = async (req, res) => {
    try {
        const hostname = req.hostname;
        const branding = await brandingService.getBrandingByHost(hostname);
        res.json(branding);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBranding = async (req, res) => {
    try {
        const { organizationId } = req.params;
        await requireOrganizationAccess(req, organizationId);
        const branding = await brandingService.updateBranding(organizationId, req.body);
        res.json(branding);
    } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
    }
};
