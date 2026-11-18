const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

// Test environment flags — set BEFORE app modules are required.
process.env.NODE_ENV = 'test';
process.env.DISABLE_REDIS = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';

let replset;

// Boot a single-node replica set so MongoDB transactions work in tests.
beforeAll(async () => {
    replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replset.getUri());
}, 120000);

// Clean every collection between tests for isolation.
afterEach(async () => {
    const { collections } = mongoose.connection;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    if (replset) await replset.stop();
    // Close the shared Redis connection so Jest can exit cleanly.
    const { redis } = require('../config/redis');
    if (redis) redis.disconnect();
});
