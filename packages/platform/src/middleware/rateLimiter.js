const rateLimit = require('express-rate-limit');

/**
 * Standard rate limiter to prevent API abuse.
 * Configured for 100 requests per 15 minutes by default.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

/**
 * Stricter rate limiter for message sending endpoint.
 */
const messageSendLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 message sends per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Message sending rate limit exceeded. Please wait a minute.'
    },
    // In production, you might want to rate limit by API Key instead of IP:
    keyGenerator: (req) => {
        return req.apiKey ? req.apiKey.id : req.ip;
    }
});

module.exports = {
    apiLimiter,
    messageSendLimiter
};
