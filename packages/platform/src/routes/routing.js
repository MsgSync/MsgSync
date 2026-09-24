const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routing');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/', authorize(PERMISSIONS.ROUTING_READ), routingController.listRules);
router.get('/providers', authorize(PERMISSIONS.ROUTING_READ), routingController.listProviders);
router.post('/', authorize(PERMISSIONS.ROUTING_MANAGE), routingController.createRule);
router.patch('/:id', authorize(PERMISSIONS.ROUTING_MANAGE), routingController.updateRule);
router.delete('/:id', authorize(PERMISSIONS.ROUTING_MANAGE), routingController.deleteRule);

module.exports = router;
