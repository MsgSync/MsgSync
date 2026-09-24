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
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/stats', authorize(PERMISSIONS.ANALYTICS_READ), getStats);
router.get('/trends', authorize(PERMISSIONS.ANALYTICS_READ), getTrends);
router.get('/volume-by-provider', authorize(PERMISSIONS.ANALYTICS_READ), getVolumeByProvider);
router.get('/financials', authorize(PERMISSIONS.ANALYTICS_READ), getFinancials);
router.get('/reports', authorize(PERMISSIONS.ANALYTICS_READ), getReports);
router.get('/live-traffic', authorize(PERMISSIONS.ANALYTICS_READ), getLiveTraffic);
router.get('/alerts', authorize(PERMISSIONS.ANALYTICS_READ), getAlerts);
router.post('/alerts', authorize(PERMISSIONS.ANALYTICS_READ), saveAlert);
router.delete('/alerts/:id', authorize(PERMISSIONS.ANALYTICS_READ), deleteAlert);

module.exports = router;
