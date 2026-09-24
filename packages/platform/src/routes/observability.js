const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics');
const authenticate = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/stats', analyticsController.getStats);
router.get('/live-traffic', analyticsController.getLiveTraffic);
router.get('/financials', analyticsController.getFinancials);
router.get('/alerts', analyticsController.getAlerts);
router.post('/alerts', analyticsController.saveAlert);
router.delete('/alerts/:id', analyticsController.deleteAlert);
router.get('/queue-depth', analyticsController.getQueueDepth);
router.get('/webhooks', analyticsController.getWebhooks);
router.post('/webhooks', analyticsController.createWebhook);

module.exports = router;
