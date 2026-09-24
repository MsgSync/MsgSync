const express = require('express');
const router = express.Router();
const securityController = require('../controllers/security');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');

router.use(authenticate);

router.get('/2fa/setup', securityController.setup2FA);
router.post('/2fa/enable', securityController.enable2FA);
router.post('/2fa/disable', securityController.disable2FA);
router.post('/restrictions', authorize(PERMISSIONS.ORGANIZATION_MANAGE), securityController.updateRestrictions);
router.get('/content-policy', authorize(PERMISSIONS.SMS_WRITE), securityController.getContentPolicy);
router.patch('/content-policy', authorize(PERMISSIONS.SMS_WRITE), securityController.updateContentPolicy);
router.post('/revoke-sessions', securityController.revokeSessions);
router.get('/audit', authorize(PERMISSIONS.AUDIT_READ), securityController.getSecurityAudit);
router.post('/break-glass', authorize(PERMISSIONS.PROVIDER_MANAGE), securityController.breakGlass);

module.exports = router;
