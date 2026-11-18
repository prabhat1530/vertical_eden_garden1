const { spawnSync } = require('child_process');

// Tests that need a real Redis use databases 14-15, separate from the app's
// database 0, and wipe them afterwards. Test files run in parallel, so each
// file gets its own database: one file's flushdb must not delete another
// file's keys (e.g. queued email jobs) mid-test.
const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:6379/15';
const testRedisUrl = (db) => `${TEST_REDIS_URL.replace(/\/\d+$/, '')}/${db}`;

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

module.exports = { TEST_REDIS_URL, testRedisUrl, redisAvailable, describeWithRedis };
