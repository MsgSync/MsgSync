const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookups');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/info', authorize(PERMISSIONS.SMS_SEND), lookupController.getLookup);
router.get('/recent', authorize(PERMISSIONS.ROUTING_MANAGE), lookupController.listRecent);
router.get('/configs', authorize(PERMISSIONS.ROUTING_MANAGE), lookupController.getConfigs);
router.post('/configs', authorize(PERMISSIONS.ROUTING_MANAGE), lookupController.saveConfig);
router.delete('/configs/:id', authorize(PERMISSIONS.ROUTING_MANAGE), lookupController.deleteConfig);
router.post('/configs/test', authorize(PERMISSIONS.ROUTING_MANAGE), lookupController.testConfig);

module.exports = router;
