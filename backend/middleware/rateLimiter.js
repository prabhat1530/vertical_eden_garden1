const { rateLimit, MemoryStore } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redis, isRedisEnabled, isRedisReady } = require('../config/redis');

// ─────────────────────────────────────────────
// Rate limiting
// Counts requests per client IP inside a time window and rejects once the
// limit is crossed. With Redis enabled, counters live in Redis so the limit
// holds across multiple server instances; otherwise each process keeps its
// own in-memory counters. If Redis fails mid-flight, passOnStoreError lets
// the request through rather than breaking the API.
// ─────────────────────────────────────────────

// Uses Redis while it is connected and switches instantly to in-memory
// counters when it is not, so a Redis outage never slows requests down.
class FallbackStore {
    constructor(redisStore) {
        this.redisStore = redisStore;
        this.memoryStore = new MemoryStore();
        this.prefix = redisStore.prefix;
        this.localKeys = false;
    }

    init(options) {
        this.memoryStore.init(options);
        // If Redis is down now, RedisStore reloads its script on first use.
        Promise.resolve(this.redisStore.init(options)).catch(() => {});
    }

    current() {
        return isRedisReady() ? this.redisStore : this.memoryStore;
    }

    get(key) { return this.current().get(key); }
    increment(key) { return this.current().increment(key); }
    decrement(key) { return this.current().decrement(key); }

    async resetKey(key) {
        await this.memoryStore.resetKey(key);
        if (isRedisReady()) await this.redisStore.resetKey(key);
    }
}

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
        passOnStoreError: true,
    };

    if (isRedisEnabled) {
        options.store = new FallbackStore(new RedisStore({
            sendCommand: (...args) => redis.call(...args),
            prefix,
        }));
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
