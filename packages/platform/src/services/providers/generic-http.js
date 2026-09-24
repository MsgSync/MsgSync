const axios = require('axios');

class GenericHttpProvider {
    constructor(config) {
        this.url = config.url;
        this.method = config.method || 'POST';
        this.headers = config.headers || {};
        this.payloadTemplate = config.payloadTemplate || {};
    }

    /**
   * Sends an SMS using a generic HTTP request.
   * @param {Object} message - The message object.
   * @returns {Promise<Object>} Delivery result.
   */
    async send(message) {
        try {
            // Safer template replacement
            const payload = { ...this.payloadTemplate };
            for (const key in payload) {
                if (typeof payload[key] === 'string') {
                    payload[key] = payload[key]
                        .replace('{{content}}', message.content)
                        .replace('{{recipient}}', message.recipient);
                }
            }

            const response = await axios({
                method: this.method,
                url: this.url,
                data: payload,
                headers: this.headers
            });

            return {
                success: true,
                externalId:
          response.data.id || response.data.sid || `http_${Date.now()}`,
                error: null
            };
        } catch (error) {
            console.error('Generic HTTP Provider Error:', error.message);
            return {
                success: false,
                externalId: null,
                error: error.message
            };
        }
    }
}

module.exports = GenericHttpProvider;
