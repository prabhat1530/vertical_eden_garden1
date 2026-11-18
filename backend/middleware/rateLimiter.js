const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

// ─────────────────────────────────────────────
// Rate limiting
// Counts requests per client IP inside a time window and rejects once the
// limit is crossed. Counters live in Redis so the limit holds even if the
// API runs as multiple processes/instances. If Redis is unavailable the
// library falls back to an in-memory store automatically (per process).
// ─────────────────────────────────────────────

const useRedisStore = process.env.DISABLE_REDIS !== 'true';

const makeLimiter = ({ windowMs, max, message, prefix }) => {
    // Skip rate limiting during automated tests so suites can exercise
    // application logic (e.g. OTP lockout) without fighting the limiter.
    if (process.env.NODE_ENV === 'test') {
        return (req, res, next) => next();
    }

    const options = {
        windowMs,
        max,
        standardHeaders: true,   // send RateLimit-* headers
        legacyHeaders: false,
        message: { success: false, error: message },
    };

    if (useRedisStore) {
        options.store = new RedisStore({
            sendCommand: (...args) => redis.call(...args),
            prefix,
        });
    }

    return rateLimit(options);
};

// Strict: OTP endpoints are the main brute-force target.
const otpLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many OTP requests. Please try again in 15 minutes.',
    prefix: 'rl:otp:',
});

// Medium: login / signup / password reset.
const authLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many attempts. Please try again in 15 minutes.',
    prefix: 'rl:auth:',
});

// Loose: everything else, a safety net against abuse.
const apiLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests. Please slow down.',
    prefix: 'rl:api:',
});

module.exports = { otpLimiter, authLimiter, apiLimiter };
