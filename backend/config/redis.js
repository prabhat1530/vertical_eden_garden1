const Redis = require('ioredis');

// ─────────────────────────────────────────────
// Shared Redis connection (optional)
// Used for rate limiting and response caching.
// Redis is ENABLED only when REDIS_URL is set and DISABLE_REDIS !== 'true'.
// When disabled, callers fall back to in-memory behaviour, so a deployment
// without Redis keeps working instead of hanging.
// `maxRetriesPerRequest: 1` makes commands fail fast while Redis is down
// (callers treat that as "skip Redis") rather than queueing forever.
// ─────────────────────────────────────────────
const isRedisEnabled = process.env.DISABLE_REDIS !== 'true' && !!process.env.REDIS_URL;

let redis = null;
let ready = false;

if (isRedisEnabled) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    redis.on('ready', () => {
        ready = true;
        console.log('✅ Redis connected');
    });
    redis.on('error', (err) => {
        if (ready) console.warn('⚠️  Redis error:', err.message);
        ready = false;
    });
    redis.on('end', () => { ready = false; });
} else {
    console.log('ℹ️  Redis disabled — using in-memory fallbacks');
}

module.exports = {
    redis,
    isRedisEnabled,
    isRedisReady: () => ready,
};
