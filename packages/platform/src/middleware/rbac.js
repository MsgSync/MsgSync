const { permissionsForRole } = require('../config/rbac');

function permissionsFromRequest(req) {
    return req.permissions || permissionsForRequest(req);
}

function permissionsForRequest(req) {
    if (Array.isArray(req.permissions)) return req.permissions;
    if (req.identityRole) return permissionsForRole(req.identityRole);
    return [];
}

function authorize(...requiredPermissions) {
    return (req, res, next) => {
        const granted = permissionsFromRequest(req);
        const allowed = requiredPermissions.every(permission => granted.includes(permission));
        if (!allowed) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this action.',
                requiredPermissions
            });
        }
        return next();
    };
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.identityRole || !roles.includes(req.identityRole)) {
            return res.status(403).json({
                status: 'error',
                message: 'Your role cannot perform this action.'
            });
        }
        return next();
    };
}

module.exports = { authorize, requireRole };
