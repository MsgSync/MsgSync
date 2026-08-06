const crypto = require('crypto');

/**
 * Service to handle OTP (One-Time Password) generation and validation.
 */
class OTPService {
    constructor() {
        this.otps = new Map(); // In production, use Redis with TTL
    }

    /**
   * Generates a numeric OTP.
   * @param {string} recipient - The phone number.
   * @param {number} length - Length of OTP (default 6).
   * @param {number} ttl - Time to live in seconds (default 300).
   */
    async generateOTP(recipient, length = 6, ttl = 300) {
        const otp = crypto
            .randomInt(Math.pow(10, length - 1), Math.pow(10, length))
            .toString();
        const expiresAt = Date.now() + ttl * 1000;

        // Store in memory for demo (should be Redis)
        this.otps.set(recipient, { otp, expiresAt });

        return otp;
    }

    /**
   * Validates an OTP.
   * @param {string} recipient - The phone number.
   * @param {string} code - The code to validate.
   */
    async validateOTP(recipient, code) {
        const entry = this.otps.get(recipient);

        if (!entry)
            return { valid: false, message: 'No OTP found for this recipient' };
        if (Date.now() > entry.expiresAt) {
            this.otps.delete(recipient);
            return { valid: false, message: 'OTP has expired' };
        }

        if (entry.otp === code) {
            this.otps.delete(recipient);
            return { valid: true };
        }

        return { valid: false, message: 'Invalid OTP code' };
    }
}

module.exports = new OTPService();
