const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../controllers/otp');
const authenticate = require('../middleware/auth');
const { messageSendLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/send', messageSendLimiter, sendOTP);
router.post('/verify', verifyOTP);

module.exports = router;
