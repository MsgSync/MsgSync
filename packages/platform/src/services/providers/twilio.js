const twilio = require('twilio');

class TwilioProvider {
    constructor(config) {
        this.client = twilio(config.accountSid, config.authToken);
        this.fromNumber = config.fromNumber;
    }

    /**
     * Sends an SMS using Twilio.
     * @param {Object} message - The message object from the database.
     * @returns {Promise<Object>} Delivery result.
     */
    async send(message) {
        try {
            const result = await this.client.messages.create({
                body: message.content,
                to: message.recipient,
                from: this.fromNumber
            });

            return {
                success: true,
                externalId: result.sid,
                error: null
            };
        } catch (error) {
            console.error('Twilio Error:', error.message);
            return {
                success: false,
                externalId: null,
                error: error.message
            };
        }
    }
}

module.exports = TwilioProvider;
