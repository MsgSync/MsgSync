const express = require('express');
const router = express.Router();
const securityController = require('../controllers/security');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');

router.use(authenticate);

router.get('/2fa/setup', authorize(PERMISSIONS.USER_MANAGE), securityController.setup2FA);
router.post('/2fa/enable', authorize(PERMISSIONS.USER_MANAGE), securityController.enable2FA);
router.post('/2fa/disable', authorize(PERMISSIONS.USER_MANAGE), securityController.disable2FA);
router.post(
    '/restrictions',
    authorize(PERMISSIONS.ORGANIZATION_MANAGE),
    securityController.updateRestrictions
);
router.post(
    '/revoke-sessions',
    authorize(PERMISSIONS.USER_MANAGE),
    securityController.revokeSessions
);
router.get('/audit', authorize(PERMISSIONS.AUDIT_READ), securityController.getSecurityAudit);
router.post('/break-glass', authorize(PERMISSIONS.PROVIDER_MANAGE), securityController.breakGlass);

module.exports = router;
