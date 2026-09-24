const webhookQueue = require('../queue/webhookQueue');

class WebhookService {
    /**
   * Triggers a webhook for a message status change.
   * @param {Object} message - The message object.
   */
    async triggerStatusChange(message) {
    // Look for webhook URL in metadata
        const webhookUrl = message.metadata?.webhook_url;
        const webhookSecret = message.metadata?.webhook_secret;

        if (!webhookUrl) return;

        const payload = {
            event: 'message.status_changed',
            timestamp: new Date().toISOString(),
            data: {
                messageId: message.id,
                status: message.status,
                externalId: message.externalId,
                recipient: message.recipient,
                error: message.error,
                metadata: message.metadata
            }
        };

        await webhookQueue.add({
            url: webhookUrl,
            payload: payload,
            secret: webhookSecret
        });
    }
}

module.exports = new WebhookService();
