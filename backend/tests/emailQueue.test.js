// Real sends are replaced by a mock; everything else (queue, worker, PDF) is real.
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

const Redis = require('ioredis');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { createEmailQueue, createEmailWorker, enqueueEmail, waitForDirectSends, JOB_OPTIONS } = require('../queues/emailQueue');
const { processEmailJob } = require('../emails/processEmailJob');
const templates = require('../emails/templates');
const { TEST_REDIS_URL, describeWithRedis } = require('./helpers/redis');

const resetEmail = { to: 'someone@example.com', name: 'Asha', resetUrl: 'https://verticaledengarden.in/reset-password/abc' };

const makePaidBooking = async () => {
    const user = await User.create({ name: 'Invoice Customer', email: 'invoice@example.com', phone: '9000012345', password: 'secret1' });
    const booking = await Booking.create({
        user: user._id, serviceSlug: 'terrace-garden', serviceName: 'Terrace Garden', areaSize: 150,
        address: '12 Rose Lane', city: 'New Delhi', preferredDate: '2030-01-10', preferredTime: '09:00 - 11:00 AM',
        basePrice: 5000, areaPrice: 18000, totalPrice: 23000, status: 'confirmed', paymentId: 'pay_invoice_test',
    });
    return booking;
};

beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockImplementation(() => Promise.resolve());
    delete process.env.EMAIL_SIMULATE_FAILURES;
});

describe('Email jobs (no Redis needed)', () => {
    test('without Redis, enqueueEmail sends directly (the old behaviour)', async () => {
        const how = await enqueueEmail('password-reset', resetEmail);
        await waitForDirectSends();

        expect(how).toBe('sent-directly');
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail.mock.calls[0][0].subject).toMatch(/Password Reset/);
    });

    test('payment receipt job attaches a PDF invoice', async () => {
        const booking = await makePaidBooking();

        await processEmailJob({ name: 'payment-receipt', data: { bookingId: String(booking._id) }, attemptsMade: 0 });

        const msg = sendEmail.mock.calls[0][0];
        expect(msg.to).toBe('invoice@example.com');
        expect(msg.attachments).toHaveLength(1);
        expect(msg.attachments[0].filename).toMatch(/^INV-[0-9A-F]{8}\.pdf$/);
        expect(msg.attachments[0].content.subarray(0, 5).toString()).toBe('%PDF-');
    });

    test('status email is skipped if the status changed again before sending', async () => {
        const booking = await makePaidBooking(); // currently "confirmed"

        const result = await processEmailJob({ name: 'booking-status', data: { bookingId: String(booking._id), status: 'cancelled' }, attemptsMade: 0 });

        expect(result).toBe('skipped');
        expect(sendEmail).not.toHaveBeenCalled();
    });

    test('customer-entered text is HTML-escaped in emails', () => {
        const email = templates.passwordReset({ ...resetEmail, name: '<script>alert(1)</script>' });
        expect(email.html).toContain('&lt;script&gt;');
        expect(email.html).not.toContain('<script>');
    });

    test('an unknown job type fails permanently instead of retrying', async () => {
        await expect(processEmailJob({ name: 'no-such-email', data: {}, attemptsMade: 0 }))
            .rejects.toThrow(/Unknown email job/);
    });
});

describeWithRedis('Email queue with Redis (retries)', () => {
    let queue;
    let worker;
    const fastRetry = { ...JOB_OPTIONS, backoff: { type: 'exponential', delay: 20 } };

    beforeEach(() => {
        queue = createEmailQueue({ url: TEST_REDIS_URL });
    });

    afterEach(async () => {
        if (worker) await worker.close();
        worker = null;
        await queue.obliterate({ force: true });
        await queue.close();
    });

    afterAll(async () => {
        const r = new Redis(TEST_REDIS_URL);
        await r.flushdb();
        r.disconnect();
    });

    const runUntil = (event) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`job did not reach "${event}" in time`)), 10000);
        worker.on(event, (job) => {
            if (event === 'completed' || job.attemptsMade >= job.opts.attempts) {
                clearTimeout(timer);
                resolve(job);
            }
        });
    });

    test('a failing email is retried and sent on the 3rd attempt', async () => {
        process.env.EMAIL_SIMULATE_FAILURES = '2'; // attempts 1 and 2 fail
        worker = createEmailWorker({ url: TEST_REDIS_URL });
        const done = runUntil('completed');

        await queue.add('password-reset', resetEmail, fastRetry);
        const job = await done;

        expect(job.attemptsMade).toBe(3);
        expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    test('after 5 failed attempts the job is kept in the failed list', async () => {
        process.env.EMAIL_SIMULATE_FAILURES = '99'; // never succeeds
        worker = createEmailWorker({ url: TEST_REDIS_URL });
        const done = runUntil('failed');

        await queue.add('password-reset', resetEmail, fastRetry);
        const job = await done;

        expect(job.attemptsMade).toBe(5);
        expect(sendEmail).not.toHaveBeenCalled();
        const failed = await queue.getFailed();
        expect(failed).toHaveLength(1);
        expect(failed[0].failedReason).toMatch(/Simulated SMTP failure/);
    });

    test('a real SMTP error is retried too', async () => {
        sendEmail
            .mockRejectedValueOnce(new Error('421 Service not available'))
            .mockResolvedValueOnce();
        worker = createEmailWorker({ url: TEST_REDIS_URL });
        const done = runUntil('completed');

        await queue.add('password-reset', resetEmail, fastRetry);
        const job = await done;

        expect(job.attemptsMade).toBe(2);
        expect(sendEmail).toHaveBeenCalledTimes(2);
    });
});
