const express = require('express');
const router = express.Router();
const {
    getStats,
    getTrends,
    getFinancials,
    getReports,
    getLiveTraffic,
    getVolumeByProvider,
    getAlerts,
    saveAlert,
    deleteAlert
} = require('../controllers/analytics');
const authenticate = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/stats', getStats);
router.get('/trends', getTrends);
router.get('/volume-by-provider', getVolumeByProvider);
router.get('/financials', getFinancials);
router.get('/reports', getReports);
router.get('/live-traffic', getLiveTraffic);
router.get('/alerts', getAlerts);
router.post('/alerts', saveAlert);
router.delete('/alerts/:id', deleteAlert);

module.exports = router;
