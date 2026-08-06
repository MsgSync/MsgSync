const express = require('express');
const router = express.Router();
const ratesController = require('../controllers/rates');

// --- Rate Plan Routes ---
router.get('/plans', ratesController.listPlans);
router.post('/plans', ratesController.createPlan);
router.post('/plans/assign', ratesController.assignPlan);

// --- Rate Routes ---
router.get('/rates/:planId?', ratesController.listRates);
router.post('/rates/:planId?', ratesController.updateRate);
router.post('/rates/import', ratesController.importRates);

// --- Utilities ---
router.get('/lookup', ratesController.lookupExchange);
router.post('/sender-id', ratesController.requestSenderId);
router.get('/sender-id/:orgId', ratesController.getSenderIds);
router.patch('/sender-id/:id/approve', ratesController.approveSenderId);

module.exports = router;
