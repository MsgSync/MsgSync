const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/branding');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/config', brandingController.getBranding);
router.patch(
    '/:organizationId',
    authenticate,
    apiLimiter,
    authorize(PERMISSIONS.ORGANIZATION_MANAGE),
    brandingController.updateBranding
);

module.exports = router;
