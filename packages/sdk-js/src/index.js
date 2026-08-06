const axios = require('axios');

class MsgSyncClient {
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'http://localhost:3001/api';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
   * Sends an SMS message.
   * @param {Object} params - The message parameters.
   * @param {string} params.recipient - Destination phone number.
   * @param {string} params.content - Message body.
   * @param {Object} [params.metadata] - Optional metadata.
   * @returns {Promise<Object>} The API response.
   */
    async sendMessage(params) {
        try {
            const response = await this.client.post('/messages', params);
            return response.data;
        } catch (error) {
            this._handleError(error);
        }
    }

    /**
   * Gets the status of a message.
   * @param {string} messageId - The ID of the message.
   * @returns {Promise<Object>} The API response.
   */
    async getMessageStatus(messageId) {
        try {
            const response = await this.client.get(`/messages/${messageId}`);
            return response.data;
        } catch (error) {
            this._handleError(error);
        }
    }

    /**
   * Lists recent messages.
   * @returns {Promise<Object>} The API response.
   */
    async listMessages() {
        try {
            const response = await this.client.get('/messages');
            return response.data;
        } catch (error) {
            this._handleError(error);
        }
    }

    /**
   * Sends an OTP (One-Time Password) to a recipient.
   * @param {Object} params - The OTP parameters.
   * @param {string} params.recipient - Destination phone number.
   * @param {number} [params.length] - Length of the OTP.
   * @param {number} [params.ttl] - Time to live in seconds.
   * @returns {Promise<Object>} The API response.
   */
    async sendOTP(params) {
        try {
            const response = await this.client.post('/otp/send', params);
            return response.data;
        } catch (error) {
            this._handleError(error);
        }
    }

    /**
   * Verifies an OTP code.
   * @param {string} recipient - Destination phone number.
   * @param {string} code - The code to verify.
   * @returns {Promise<Object>} The API response.
   */
    async verifyOTP(recipient, code) {
        try {
            const response = await this.client.post('/otp/verify', {
                recipient,
                code
            });
            return response.data;
        } catch (error) {
            this._handleError(error);
        }
    }

    _handleError(error) {
        if (error.response) {
            const { status, data } = error.response;
            const message = data && data.message ? data.message : error.message;
            throw new Error(`MsgSync API Error (${status}): ${message}`);
        }
        throw error;
    }
}

module.exports = MsgSyncClient;
