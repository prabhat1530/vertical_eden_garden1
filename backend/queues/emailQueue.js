const { Queue, Worker } = require('bullmq');
const { isRedisEnabled, isRedisReady } = require('../config/redis');
const { processEmailJob } = require('../emails/processEmailJob');

// ─────────────────────────────────────────────
// Email job queue (BullMQ on Redis).
//
// Before: emails were sent once, fire-and-forget; a failure was logged and the
// email was lost.
// Now: enqueueEmail() stores a job in Redis and returns immediately. A worker
// sends it; if sending throws, BullMQ retries with exponential backoff
// (5 attempts: retries after 30s, 1m, 2m, 4m). Jobs survive a server restart,
// and jobs that fail every attempt stay in the "failed" list for 7 days so
// they can be inspected and retried from the admin dashboard.
//
// Without Redis (REDIS_URL unset), or if Redis is unreachable at that moment
// (checked on the shared Redis connection before touching the queue), the
// email is sent directly instead — the old behaviour, no retries.
// ─────────────────────────────────────────────

const QUEUE_NAME = 'emails';
const RETRY_DELAY_MS = parseInt(process.env.EMAIL_RETRY_DELAY_MS || '30000', 10);

const JOB_OPTIONS = {
    attempts: 5,
    backoff: { type: 'exponential', delay: RETRY_DELAY_MS },
    removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
    removeOnFail: { age: 7 * 24 * 60 * 60 },
};

// Producer. No offline queue: a command is never buffered while Redis is
// down, so a job can't be added late after we already sent the email
// directly (which would send it twice). The first add waits for the queue's
// own connection to be ready; enqueueEmail only calls add while Redis is up.
const createEmailQueue = ({ url, prefix } = {}) => {
    const queue = new Queue(QUEUE_NAME, {
        connection: { url, enableOfflineQueue: false },
        prefix,
    });
    queue.on('error', () => { /* reported by enqueueEmail when it matters */ });
    return queue;
};

// Worker: BullMQ requires maxRetriesPerRequest: null for its blocking reads.
const createEmailWorker = ({ url, prefix, processor = processEmailJob, concurrency = 5 } = {}) =>
    new Worker(QUEUE_NAME, processor, {
        connection: { url, maxRetriesPerRequest: null },
        prefix,
        concurrency,
    });

let queue = null;
let worker = null;
const pendingDirectSends = new Set();

const getQueue = () => {
    if (!isRedisEnabled) return null;
    if (!queue) queue = createEmailQueue({ url: process.env.REDIS_URL });
    return queue;
};

const sendDirectly = (name, data) => {
    const p = processEmailJob({ name, data, attemptsMade: 0 })
        .catch((err) => console.error(`📧 Email "${name}" failed (no queue, so it won't be retried): ${err.message}`))
        .finally(() => pendingDirectSends.delete(p));
    pendingDirectSends.add(p);
    return p;
};

// Queue an email job. Never throws, never blocks the request on SMTP.
const enqueueEmail = async (name, data) => {
    const q = getQueue();
    if (q && isRedisReady()) {
        try {
            await q.add(name, data, JOB_OPTIONS);
            return 'queued';
        } catch (err) {
            console.warn(`📧 Email queue unavailable (${err.message}) — sending "${name}" directly`);
        }
    }
    sendDirectly(name, data);
    return 'sent-directly';
};

const startEmailWorker = () => {
    if (!isRedisEnabled || worker) return worker;
    worker = createEmailWorker({ url: process.env.REDIS_URL });

    worker.on('completed', (job, result) => {
        if (result === 'sent') console.log(`📧 Email job ${job.id} (${job.name}) sent on attempt ${job.attemptsMade}`);
    });
    worker.on('failed', (job, err) => {
        if (!job) return;
        const final = job.attemptsMade >= (job.opts.attempts || 1);
        console.warn(`📧 Email job ${job.id} (${job.name}) attempt ${job.attemptsMade} failed: ${err.message}${final ? ' — giving up (kept in failed list)' : ' — will retry'}`);
    });
    worker.on('error', (err) => console.warn('📧 Email worker error:', err.message));

    console.log('📧 Email worker started (retries enabled)');
    return worker;
};

// For the admin dashboard: job counts and the latest failures.
const getEmailQueueStats = async () => {
    const q = getQueue();
    if (!q) return { enabled: false };
    try {
        const counts = await q.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed');
        const failed = await q.getFailed(0, 9);
        return {
            enabled: true,
            counts,
            recentFailed: failed.map((j) => ({
                id: j.id,
                type: j.name,
                reason: j.failedReason,
                attempts: j.attemptsMade,
                failedAt: j.finishedOn ? new Date(j.finishedOn) : null,
            })),
        };
    } catch (err) {
        return { enabled: true, error: `Redis unreachable: ${err.message}` };
    }
};

// Put every failed job back in the queue for another round of attempts.
const retryFailedEmails = async () => {
    const q = getQueue();
    if (!q) return 0;
    const failed = await q.getFailed(0, 999);
    await Promise.all(failed.map((j) => j.retry()));
    return failed.length;
};

// Used by tests to wait for direct (no-Redis) sends to finish.
const waitForDirectSends = () => Promise.all([...pendingDirectSends]);

const closeEmailQueue = async () => {
    await Promise.all([worker && worker.close(), queue && queue.close()]);
    worker = null;
    queue = null;
};

module.exports = {
    JOB_OPTIONS,
    createEmailQueue,
    createEmailWorker,
    enqueueEmail,
    startEmailWorker,
    getEmailQueueStats,
    retryFailedEmails,
    waitForDirectSends,
    closeEmailQueue,
};
