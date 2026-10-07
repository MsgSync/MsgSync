const crypto = require('crypto');

const MIN_LENGTH = 4;
const MAX_LENGTH = 8;
const MIN_TTL = 30;
const MAX_TTL = 600;
const MAX_ATTEMPTS = 5;

function clamp(value, min, max, fallback) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

/**
 * Service to handle OTP (One-Time Password) generation and validation.
 * Codes are stored hashed and scoped per organization and recipient.
 */
class OTPService {
    constructor() {
        this.otps = new Map(); // In production, use Redis with TTL
        this.secret = crypto.randomBytes(32);
    }

    key(organizationId, recipient) {
        return `${organizationId || 'global'}:${recipient}`;
    }

    hash(code) {
        return crypto.createHmac('sha256', this.secret).update(String(code)).digest();
    }

    /**
     * Generates a numeric OTP.
     * @param {string} recipient - The phone number.
     * @param {number} length - Length of OTP (default 6).
     * @param {number} ttl - Time to live in seconds (default 300).
     * @param {string} organizationId - The owning organization.
     */
    async generateOTP(recipient, length = 6, ttl = 300, organizationId = null) {
        const digits = clamp(length, MIN_LENGTH, MAX_LENGTH, 6);
        const seconds = clamp(ttl, MIN_TTL, MAX_TTL, 300);
        const otp = crypto.randomInt(Math.pow(10, digits - 1), Math.pow(10, digits)).toString();

        this.otps.set(this.key(organizationId, recipient), {
            hash: this.hash(otp),
            expiresAt: Date.now() + seconds * 1000,
            attempts: 0
        });

        return { otp, ttl: seconds };
    }

    discard(recipient, organizationId = null) {
        this.otps.delete(this.key(organizationId, recipient));
    }

    /**
     * Validates an OTP. A code can be tried at most MAX_ATTEMPTS times.
     * @param {string} recipient - The phone number.
     * @param {string} code - The code to validate.
     * @param {string} organizationId - The owning organization.
     */
    async validateOTP(recipient, code, organizationId = null) {
        const key = this.key(organizationId, recipient);
        const entry = this.otps.get(key);

        if (!entry) return { valid: false, message: 'No OTP found for this recipient' };
        if (Date.now() > entry.expiresAt) {
            this.otps.delete(key);
            return { valid: false, message: 'OTP has expired' };
        }

        entry.attempts += 1;
        const matches = crypto.timingSafeEqual(this.hash(code), entry.hash);

        if (matches) {
            this.otps.delete(key);
            return { valid: true };
        }

        if (entry.attempts >= MAX_ATTEMPTS) {
            this.otps.delete(key);
            return { valid: false, message: 'Too many invalid attempts. Request a new code.' };
        }

        return { valid: false, message: 'Invalid OTP code' };
    }
}

module.exports = new OTPService();
module.exports.OTPService = OTPService;
module.exports.MAX_ATTEMPTS = MAX_ATTEMPTS;
