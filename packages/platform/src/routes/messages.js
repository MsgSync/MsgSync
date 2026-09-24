const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getMessageStatus,
    listMessages,
    cancelMessage
} = require('../controllers/messages');

const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter, messageSendLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

/**
 * @openapi
 * /messages:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient, content]
 *             properties:
 *               recipient: { type: string }
 *               content: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Message successfully queued
 *   get:
 *     summary: List recent messages
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: List of messages
 */
router.post('/', messageSendLimiter, authorize(PERMISSIONS.SMS_SEND), sendMessage);
router.get('/', authorize(PERMISSIONS.SMS_READ), listMessages);
/**
 * @openapi
 * /messages/{id}:
 *   get:
 *     summary: Get message status
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message status object
 */
router.get('/:id', authorize(PERMISSIONS.SMS_READ), getMessageStatus);
router.delete('/:id', authorize(PERMISSIONS.SMS_WRITE), cancelMessage);

module.exports = router;
