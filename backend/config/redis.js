const Redis = require('ioredis');

// ─────────────────────────────────────────────
// Shared Redis connection
// Used for: rate limiting, response caching, and the BullMQ job queue.
// `maxRetriesPerRequest: null` keeps the connection compatible with BullMQ.
// Errors are logged (not thrown) so a Redis hiccup never crashes the API.
// ─────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 200, 2000),
});

let redisReady = false;

redis.on('connect', () => {
    redisReady = true;
    console.log('✅ Redis connected');
});
redis.on('error', (err) => {
    redisReady = false;
    console.warn('⚠️  Redis error:', err.message);
});

redis.isReady = () => redisReady;

module.exports = redis;
