const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider');
const authenticate = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/', providerController.list);
router.patch('/:id', providerController.update);
router.post('/:id/health', providerController.healthCheck);
router.post('/:id/test', providerController.testMessage);

module.exports = router;
