// This file runs the app WITH Redis (database 15) to test caching.
const { TEST_REDIS_URL, describeWithRedis } = require('./helpers/redis');

process.env.DISABLE_REDIS = 'false';
process.env.REDIS_URL = TEST_REDIS_URL;

jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { signAccessToken } = require('../utils/tokens');
const { redis, isRedisReady } = require('../config/redis');
const { closeEmailQueue } = require('../queues/emailQueue');
const { toISTDateString } = require('../config/slots');

const waitForRedis = async () => {
    for (let i = 0; i < 50 && !isRedisReady(); i++) await new Promise((r) => setTimeout(r, 100));
};

describeWithRedis('Redis caching (Phase 4)', () => {
    beforeAll(async () => {
        await waitForRedis();
        await redis.flushdb();
        await Slot.init();
    });
    afterEach(() => redis.flushdb());
    afterAll(() => closeEmailQueue());

    test('service reviews: MISS, then HIT, then MISS again after a new review', async () => {
        const user = await User.create({ name: 'Reviewer', email: 'reviewer@example.com', phone: '9000099001', password: 'secret1' });
        const booking = await Booking.create({
            user: user._id, serviceSlug: 'terrace-garden', serviceName: 'Terrace Garden', areaSize: 10,
            address: 'x', city: 'y', preferredDate: '2030-01-01', preferredTime: '09:00 - 11:00 AM',
            basePrice: 1, areaPrice: 1, totalPrice: 2, status: 'completed',
        });

        const first = await request(app).get('/api/reviews/terrace-garden');
        const second = await request(app).get('/api/reviews/terrace-garden');
        expect(first.headers['x-cache']).toBe('MISS');
        expect(second.headers['x-cache']).toBe('HIT');
        expect(second.body.count).toBe(0);

        await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${signAccessToken(user)}`)
            .send({ bookingId: String(booking._id), rating: 5, comment: 'Lovely wall!' });

        const third = await request(app).get('/api/reviews/terrace-garden');
        expect(third.headers['x-cache']).toBe('MISS');
        expect(third.body.count).toBe(1); // the new review shows immediately
        expect(third.body.averageRating).toBe(5);
    });

    test('admin stats: cached, and refreshed as soon as a booking is made', async () => {
        const admin = await User.create({ name: 'Admin', email: 'admin@example.com', phone: '9000099002', password: 'secret1', role: 'admin' });
        const customer = await User.create({ name: 'Cust', email: 'cust@example.com', phone: '9000099003', password: 'secret1' });
        const adminToken = signAccessToken(admin);

        const first = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        const second = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(first.headers['x-cache']).toBe('MISS');
        expect(second.headers['x-cache']).toBe('HIT');
        expect(second.body.stats.totalBookings).toBe(0);

        const created = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${signAccessToken(customer)}`)
            .send({
                serviceSlug: 'artificial-grass', serviceName: 'Artificial Grass', areaSize: 10, address: 'x', city: 'y',
                preferredDate: toISTDateString(new Date(Date.now() + 3 * 864e5)), preferredTime: '09:00 - 11:00 AM',
            });
        expect(created.status).toBe(201);

        const third = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(third.headers['x-cache']).toBe('MISS');
        expect(third.body.stats.totalBookings).toBe(1); // not the stale cached 0
    });
});
