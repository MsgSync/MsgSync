const auditService = require('../services/auditService');

exports.getLogs = async (req, res) => {
    try {
        const organizationId = req.organization ? req.organization.id : 'SYSTEM';

        // If we have a query param for system-wide logs and the requester is authorized
        const targetOrg = req.query.system === 'true' ? 'SYSTEM' : organizationId;

        const logs = await auditService.getLogs(targetOrg);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
