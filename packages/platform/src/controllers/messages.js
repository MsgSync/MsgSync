const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const messageQueue = require('../queue/messageQueue');

/**
 * Sends a new message by adding it to the processing queue.
 */
async function sendMessage(req, res) {
    const { recipient, content, metadata, scheduledAt } = req.body;

    if (!recipient || !content) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields: recipient, content'
        });
    }

    try {
        const securityService = require('../services/securityService');
        const remoteIp = req.ip || req.connection.remoteAddress;

        // 0. Security & Anti-Fraud Check
        if (req.apiKey && req.organization) {
            const securityCheck = await securityService.validateRequest(
                req.apiKey,
                req.organization,
                recipient,
                content,
                remoteIp
            );

            if (!securityCheck.valid) {
                return res.status(403).json({
                    status: 'error',
                    code: securityCheck.reason,
                    message: `Security rejection: ${securityCheck.reason}`
                });
            }
        }

        const scheduleDate = scheduledAt ? new Date(scheduledAt) : new Date();
        const delay = Math.max(0, scheduleDate.getTime() - Date.now());

        // 1. Save message to database with 'queued' status
        const message = await prisma.message.create({
            data: {
                recipient,
                content,
                metadata,
                status: 'queued',
                scheduledAt: scheduleDate,
                apiKeyId: req.apiKey ? req.apiKey.id : null,
                organizationId: req.organization ? req.organization.id : null
            }
        });

        // 2. Add to Bull queue for background processing with optional delay
        await messageQueue.add({ messageId: message.id }, { delay });

        res.status(202).json({
            status: 'success',
            data: message,
            message:
        delay > 0
            ? `Message scheduled for ${scheduleDate.toISOString()}`
            : 'Message accepted and queued for delivery'
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Gets the status of a specific message.
 */
async function getMessageStatus(req, res) {
    const { id } = req.params;
    try {
        const message = await prisma.message.findUnique({
            where: { id }
        });

        if (!message) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Message not found' });
        }

        res.status(200).json({ status: 'success', data: message });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Lists messages with optional filtering.
 */
async function listMessages(req, res) {
    try {
        const messages = await prisma.message.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.status(200).json({ status: 'success', data: messages });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Cancels a message if it hasn't been sent yet.
 */
async function cancelMessage(req, res) {
    const { id } = req.params;
    try {
        const message = await prisma.message.findUnique({
            where: { id }
        });

        if (!message) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Message not found' });
        }

        if (message.status !== 'queued') {
            return res.status(400).json({
                status: 'error',
                message: `Cannot cancel message in status: ${message.status}`
            });
        }

        const updatedMessage = await prisma.message.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        res.status(200).json({ status: 'success', data: updatedMessage });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    sendMessage,
    getMessageStatus,
    listMessages,
    cancelMessage
};
