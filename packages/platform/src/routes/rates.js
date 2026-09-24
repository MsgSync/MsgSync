const express = require('express');
const router = express.Router();
const ratesController = require('../controllers/rates');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

// --- Rate Plan Routes ---
router.get('/plans', authorize(PERMISSIONS.RATE_READ), ratesController.listPlans);
router.post('/plans', authorize(PERMISSIONS.RATE_MANAGE), ratesController.createPlan);
router.post('/plans/assign', authorize(PERMISSIONS.RATE_MANAGE), ratesController.assignPlan);

// --- Rate Routes ---
router.get('/rates/:planId?', authorize(PERMISSIONS.RATE_READ), ratesController.listRates);
router.post('/rates/:planId?', authorize(PERMISSIONS.RATE_MANAGE), ratesController.updateRate);
router.post('/rates/import', authorize(PERMISSIONS.RATE_MANAGE), ratesController.importRates);

// --- Utilities ---
router.get('/lookup', authorize(PERMISSIONS.RATE_READ), ratesController.lookupExchange);
router.post('/sender-id', authorize(PERMISSIONS.ORGANIZATION_READ), ratesController.requestSenderId);
router.get('/sender-id/:orgId', authorize(PERMISSIONS.ORGANIZATION_READ), ratesController.getSenderIds);
router.patch('/sender-id/:id/approve', authorize(PERMISSIONS.RATE_MANAGE), ratesController.approveSenderId);

module.exports = router;
