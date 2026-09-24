const axios = require('axios');

/**
 * Service to handle external integrations (Slack, Discord, MS Teams).
 */
class IntegrationService {
    /**
   * Sends a notification to a Slack webhook.
   * @param {string} webhookUrl - The Slack Incoming Webhook URL.
   * @param {Object} message - The message object that triggered the alert.
   */
    async sendSlackAlert(webhookUrl, message) {
        if (!webhookUrl) return;

        console.log(`Sending Slack alert for message ${message.id}...`);

        const payload = {
            text: '🚨 *MsgSync Delivery Alert*',
            attachments: [
                {
                    color: message.status === 'failed' ? '#ef4444' : '#22c55e',
                    fields: [
                        { title: 'Message ID', value: message.id, short: true },
                        { title: 'Status', value: message.status, short: true },
                        { title: 'Recipient', value: message.recipient, short: true },
                        {
                            title: 'Provider',
                            value: message.provider || 'N/A',
                            short: true
                        },
                        { title: 'Error', value: message.error || 'None', short: false }
                    ],
                    footer: 'MsgSync Integration Service',
                    ts: Math.floor(Date.now() / 1000)
                }
            ]
        };

        try {
            await axios.post(webhookUrl, payload);
        } catch (error) {
            console.error('Slack alert failed:', error.message);
        }
    }
}

module.exports = new IntegrationService();
