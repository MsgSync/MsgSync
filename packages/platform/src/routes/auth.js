const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authenticate = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const loginLimiter = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many login attempts. Please try again in 15 minutes.' }
});

router.post('/register', apiLimiter, authController.register);
router.post('/login', apiLimiter, loginLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/verify-2fa', authController.verify2FA);
router.get('/sso/:provider', authController.ssoLogin);
router.get('/sso/:provider/callback', authController.ssoLogin);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
