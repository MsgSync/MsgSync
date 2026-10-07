const auditService = require('../services/auditService');
const { getOrganizationScope } = require('../services/authorizationService');
const { ROLES } = require('../config/rbac');

exports.getLogs = async (req, res) => {
    try {
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));

        if (req.query.system === 'true') {
            if (req.identityRole !== ROLES.ADMIN) {
                return res.status(403).json({ error: 'Only administrators can read system logs' });
            }
            return res.json(await auditService.getLogs('SYSTEM', limit));
        }

        const scope = await getOrganizationScope(req);
        const logs = await auditService.getLogs(scope === null ? 'ALL' : scope, limit);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
