const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/', authorize(PERMISSIONS.PROVIDER_READ), providerController.list);
router.patch('/:id', authorize(PERMISSIONS.PROVIDER_MANAGE), providerController.update);
router.post('/:id/health', authorize(PERMISSIONS.PROVIDER_MANAGE), providerController.healthCheck);
router.post('/:id/test', authorize(PERMISSIONS.PROVIDER_MANAGE), providerController.testMessage);

module.exports = router;
