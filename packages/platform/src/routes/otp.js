const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../controllers/otp');
const authenticate = require('../middleware/auth');
const { messageSendLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

/**
 * @openapi
 * /otp/send:
 *   post:
 *     summary: Send an OTP verification code
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send', messageSendLimiter, sendOTP);
/**
 * @openapi
 * /otp/verify:
 *   post:
 *     summary: Verify an OTP code
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient, code]
 *             properties:
 *               recipient: { type: string }
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Code verified successfully
 *       400:
 *         description: Invalid or expired code
 */
router.post('/verify', verifyOTP);

module.exports = router;
