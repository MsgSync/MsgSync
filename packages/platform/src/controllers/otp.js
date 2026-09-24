const otpService = require('../services/otpService');
const { sendMessage } = require('./messages');

/**
 * Handles sending an OTP via SMS.
 */
async function sendOTP(req, res) {
    const { recipient, ttl, length } = req.body;

    if (!recipient) {
        return res
            .status(400)
            .json({ status: 'error', message: 'Recipient is required' });
    }

    try {
        const otp = await otpService.generateOTP(recipient, length, ttl);

        // Wrap the standard sendMessage controller functionality
        // but customize the content for OTP
        req.body.content = `Your MsgSync verification code is: ${otp}. It will expire in ${ttl || 300} seconds.`;

        return await sendMessage(req, res);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Validates an OTP provided by the user.
 */
async function verifyOTP(req, res) {
    const { recipient, code } = req.body;

    if (!recipient || !code) {
        return res
            .status(400)
            .json({ status: 'error', message: 'Recipient and code are required' });
    }

    try {
        const result = await otpService.validateOTP(recipient, code);

        if (result.valid) {
            res
                .status(200)
                .json({ status: 'success', message: 'OTP verified successfully' });
        } else {
            res.status(400).json({ status: 'error', message: result.message });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    sendOTP,
    verifyOTP
};
