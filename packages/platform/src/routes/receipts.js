const express = require('express');
const crypto = require('crypto');
const twilio = require('twilio');
const { PrismaClient } = require('@prisma/client');
const receiptService = require('../services/deliveryReceiptService');

const prisma = new PrismaClient();
const router = express.Router();

function safeEqual(a, b) {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function publicUrl(path) {
    return `${(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}${path}`;
}

router.post('/twilio', express.urlencoded({ extended: false }), async (req, res) => {
    try {
        const { MessageSid, MessageStatus, SmsStatus, ErrorCode, ErrorMessage } = req.body;
        if (!MessageSid) return res.status(400).json({ status: 'error', message: 'Missing sid' });

        const message = await prisma.message.findUnique({ where: { externalId: MessageSid } });
        const provider = message?.provider
            ? await prisma.provider.findFirst({ where: { name: message.provider, type: 'twilio' } })
            : null;
        if (!message || !provider?.config?.authToken) {
            return res.status(404).json({ status: 'error', message: 'Message not found' });
        }

        const valid = twilio.validateRequest(
            provider.config.authToken,
            req.headers['x-twilio-signature'] || '',
            publicUrl('/api/receipts/twilio'),
            req.body
        );
        if (!valid) return res.status(403).json({ status: 'error', message: 'Invalid signature' });

        const status = receiptService.normalizeStatus(MessageStatus || SmsStatus);
        const error = ErrorCode ? `${ErrorCode}: ${ErrorMessage || 'Delivery failed'}` : null;
        const result = await receiptService.applyReceipt({
            externalId: MessageSid,
            status,
            error
        });

        res.status(200).json({ status: 'success', applied: result.applied });
    } catch (error) {
        console.error('Twilio receipt error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process receipt' });
    }
});

router.post('/http/:providerId', express.json(), async (req, res) => {
    try {
        const provider = await prisma.provider.findUnique({ where: { id: req.params.providerId } });
        const dlr = provider?.config?.dlr;
        if (!provider || !dlr?.secret) {
            return res.status(404).json({ status: 'error', message: 'Receipts not enabled' });
        }
        if (!safeEqual(req.headers['x-dlr-secret'], dlr.secret)) {
            return res.status(403).json({ status: 'error', message: 'Invalid secret' });
        }

        const items = Array.isArray(req.body) ? req.body : [req.body];
        let applied = 0;
        for (const item of items) {
            const result = await receiptService.applyReceipt({
                externalId: item?.[dlr.idField || 'id'],
                status: receiptService.normalizeStatus(
                    item?.[dlr.statusField || 'status'],
                    dlr.statusMap
                ),
                error: dlr.errorField ? item?.[dlr.errorField] : null
            });
            if (result.applied) applied += 1;
        }

        res.status(200).json({ status: 'success', applied });
    } catch (error) {
        console.error('HTTP receipt error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process receipt' });
    }
});

module.exports = router;
