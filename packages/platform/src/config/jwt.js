const crypto = require('crypto');

let cachedSecret = null;

function getJwtSecret() {
    if (cachedSecret) {
        return cachedSecret;
    }

    if (process.env.JWT_SECRET) {
        cachedSecret = process.env.JWT_SECRET;
        return cachedSecret;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
    }

    console.warn('JWT_SECRET is not set; using an ephemeral secret. Tokens reset on restart.');
    cachedSecret = crypto.randomBytes(48).toString('hex');
    return cachedSecret;
}

module.exports = { getJwtSecret };
