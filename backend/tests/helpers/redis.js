const { spawnSync } = require('child_process');

// Tests that need a real Redis use database 15, separate from the app's
// database 0, and wipe it afterwards.
const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:6379/15';

// Checked synchronously so a test file can choose describe vs describe.skip.
const isRedisReachable = () => {
    const probe = `
        const Redis = require('ioredis');
        const r = new Redis(process.argv[1], { lazyConnect: true, connectTimeout: 1000, maxRetriesPerRequest: 0, retryStrategy: () => null });
        r.connect().then(() => r.ping()).then(() => { r.disconnect(); process.exit(0); }).catch(() => process.exit(1));
    `;
    const result = spawnSync(process.execPath, ['-e', probe, TEST_REDIS_URL], { cwd: __dirname, timeout: 5000 });
    return result.status === 0;
};

const redisAvailable = isRedisReachable();
if (!redisAvailable) {
    console.warn(`⚠️  Redis not reachable at ${TEST_REDIS_URL} — Redis-backed tests are skipped.`);
}

const describeWithRedis = redisAvailable ? describe : describe.skip;

module.exports = { TEST_REDIS_URL, redisAvailable, describeWithRedis };
