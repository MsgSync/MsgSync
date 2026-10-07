const otpService = require('../services/otpService');
const { sendMessage } = require('./messages');

const REDACTED_CONTENT = 'Verification code redacted';

/**
 * Handles sending an OTP via SMS.
 */
async function sendOTP(req, res) {
    const { recipient, ttl, length } = req.body;

    if (!recipient) {
        return res.status(400).json({ status: 'error', message: 'Recipient is required' });
    }

    try {
        const organizationId = req.organization?.id || null;
        const { otp, ttl: effectiveTtl } = await otpService.generateOTP(
            recipient,
            length,
            ttl,
            organizationId
        );

        req.body.content = `Your MsgSync verification code is: ${otp}. It will expire in ${effectiveTtl} seconds.`;
        req.body.metadata = { ...(req.body.metadata || {}), otp: true };

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 400) {
                otpService.discard(recipient, organizationId);
            }
            if (body?.data?.content) {
                body = { ...body, data: { ...body.data, content: REDACTED_CONTENT } };
            }
            return originalJson(body);
        };

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
        const result = await otpService.validateOTP(
            String(recipient),
            String(code),
            req.organization?.id || null
        );

        if (result.valid) {
            res.status(200).json({ status: 'success', message: 'OTP verified successfully' });
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
