const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundles');
const authenticate = require('../middleware/auth');
const { authorize, requireRole } = require('../middleware/rbac');
const { PERMISSIONS, ROLES } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/', authorize(PERMISSIONS.ORGANIZATION_READ), bundleController.listBundles);
router.post('/', requireRole(ROLES.ADMIN), bundleController.createBundle);
router.patch('/:id', requireRole(ROLES.ADMIN), bundleController.updateBundle);
router.post('/subscribe', authorize(PERMISSIONS.ORGANIZATION_READ), bundleController.subscribe);
router.get(
    '/organization/:orgId',
    authorize(PERMISSIONS.ORGANIZATION_READ),
    bundleController.getOrgSubscriptions
);

module.exports = router;
