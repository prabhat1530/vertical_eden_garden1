const { redis, isRedisReady } = require('../config/redis');

// ─────────────────────────────────────────────
// Read-through cache in Redis ("cache-aside").
//   HIT    → answer came from Redis, the database was not touched
//   MISS   → computed from the database, then stored in Redis with a TTL
//   BYPASS → Redis not available; computed every time (the old behaviour)
// Entries expire on their own (TTL) and are deleted early whenever the
// underlying data changes (invalidateCache), so readers never see stale data
// for longer than the TTL.
// ─────────────────────────────────────────────

const CACHE_KEYS = {
    adminStats: 'cache:admin:stats',
    reviews: (serviceSlug) => `cache:reviews:${serviceSlug}`,
    reviewSummary: 'cache:reviews:summary',
};

const cached = async (key, ttlSeconds, compute) => {
    if (!isRedisReady()) return { value: await compute(), status: 'BYPASS' };

    try {
        const hit = await redis.get(key);
        if (hit !== null) return { value: JSON.parse(hit), status: 'HIT' };
    } catch {
        return { value: await compute(), status: 'BYPASS' };
    }

    const value = await compute();
    redis.set(key, JSON.stringify(value), 'EX', ttlSeconds).catch(() => {});
    return { value, status: 'MISS' };
};

// Delete cache entries after the data behind them changes. Never throws.
const invalidateCache = (...keys) => {
    if (!keys.length || !isRedisReady()) return Promise.resolve();
    return redis.del(...keys).catch(() => {});
};

module.exports = { CACHE_KEYS, cached, invalidateCache };
