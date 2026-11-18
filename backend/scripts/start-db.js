const path = require('path');
const fs = require('fs');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

// ─────────────────────────────────────────────
// Local development database
// Runs a real MongoDB server as a single-node replica set named "rs0".
// • Replica set → multi-document transactions work (needed for slot booking).
// • Fixed port 27017 → same as a normal MongoDB install.
// • dbPath on disk → data survives restarts (unlike the in-memory test DB).
// Start with: npm run db   (stop with Ctrl+C)
// ─────────────────────────────────────────────

const DB_PATH = path.join(__dirname, '..', '.mongo-data');
const PORT = 27017;

fs.mkdirSync(DB_PATH, { recursive: true });

(async () => {
    const replSet = await MongoMemoryReplSet.create({
        replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' },
        instanceOpts: [{ port: PORT, dbPath: DB_PATH }],
    });

    console.log('\n🍃 Local MongoDB replica set is running');
    console.log(`   URI:  mongodb://127.0.0.1:${PORT}/veg_dev?replicaSet=rs0`);
    console.log(`   Data: ${DB_PATH}`);
    console.log('   Press Ctrl+C to stop.\n');

    const shutdown = async () => {
        // doCleanup:false keeps the data folder so nothing is lost.
        await replSet.stop({ doCleanup: false });
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
})().catch((err) => {
    console.error('❌ Failed to start local MongoDB:', err.message);
    process.exit(1);
});
