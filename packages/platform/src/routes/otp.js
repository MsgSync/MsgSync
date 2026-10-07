const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../controllers/otp');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { messageSendLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/send', authorize(PERMISSIONS.SMS_SEND), messageSendLimiter, sendOTP);
router.post('/verify', authorize(PERMISSIONS.SMS_SEND), otpVerifyLimiter, verifyOTP);

module.exports = router;
