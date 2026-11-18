const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Payment = require('../models/Payment');
const { signAccessToken } = require('../utils/tokens');
const { toISTDateString } = require('../config/slots');
const { releaseExpiredHolds } = require('../services/bookingService');

const SLOT_A = '09:00 - 11:00 AM';
const SLOT_B = '11:00 - 01:00 PM';
const SLOT_C = '01:00 - 03:00 PM';
const daysFromNow = (n) => toISTDateString(new Date(Date.now() + n * 24 * 60 * 60 * 1000));
const DATE = daysFromNow(5);

let userCounter = 0;
const makeUser = async () => {
    userCounter += 1;
    const user = await User.create({
        name: `User ${userCounter}`,
        email: `user${userCounter}@example.com`,
        phone: `90000${String(userCounter).padStart(5, '0')}`,
        password: 'secret1',
    });
    return { user, token: signAccessToken(user) };
};

const book = (token, overrides = {}) => request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({
        serviceSlug: 'artificial-grass',
        serviceName: 'Artificial Grass',
        areaSize: 100,
        address: '1 Garden Street',
        city: 'Delhi',
        preferredDate: DATE,
        preferredTime: SLOT_A,
        ...overrides,
    });

const slotCount = async (date, time) => {
    const slot = await Slot.findOne({ date, time });
    return slot ? slot.bookedCount : 0;
};

// Make a booking's payment hold expire, then run the sweeper.
const expireHold = async (bookingId) => {
    await Booking.updateOne({ _id: bookingId }, { holdExpiresAt: new Date(Date.now() - 1000) });
    await releaseExpiredHolds();
};

const razorpaySignature = (orderId, paymentId) => crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

beforeAll(async () => {
    await Slot.init(); // build the unique (date, time) index before racing on it
});

describe('Slot-based booking (Phase 2)', () => {
    test('only ONE of 5 simultaneous bookings for the same slot succeeds', async () => {
        const users = [];
        for (let i = 0; i < 5; i++) users.push(await makeUser());

        const results = await Promise.all(users.map((u) => book(u.token)));
        const codes = results.map((r) => r.status);

        expect(codes.filter((c) => c === 201)).toHaveLength(1);
        expect(codes.filter((c) => c === 409)).toHaveLength(4);
        expect(await slotCount(DATE, SLOT_A)).toBe(1);
        // The 4 losers created a Booking inside their transaction before the
        // slot claim failed — the rollback must have discarded all of them.
        expect(await Booking.countDocuments()).toBe(1);
    });

    test('a new booking is pending and holds its slot for 15 minutes', async () => {
        const { token } = await makeUser();
        const res = await book(token);

        expect(res.status).toBe(201);
        expect(res.body.booking.status).toBe('pending');
        const holdMs = new Date(res.body.booking.holdExpiresAt) - Date.now();
        expect(holdMs).toBeGreaterThan(14 * 60 * 1000);
        expect(holdMs).toBeLessThanOrEqual(15 * 60 * 1000);
    });

    test('availability endpoint marks booked slots as unavailable', async () => {
        const { token } = await makeUser();
        await book(token);

        const res = await request(app).get(`/api/bookings/slots?date=${DATE}`);
        expect(res.status).toBe(200);
        const byTime = Object.fromEntries(res.body.slots.map((s) => [s.time, s.available]));
        expect(byTime[SLOT_A]).toBe(false);
        expect(byTime[SLOT_B]).toBe(true);
        expect(res.body.slots).toHaveLength(5);
    });

    test('cancelling frees the slot for someone else', async () => {
        const first = await makeUser();
        const second = await makeUser();
        const created = await book(first.token);

        const cancel = await request(app)
            .put(`/api/bookings/${created.body.booking.id}/cancel`)
            .set('Authorization', `Bearer ${first.token}`);
        expect(cancel.status).toBe(200);
        expect(cancel.body.booking.status).toBe('cancelled');
        expect(await slotCount(DATE, SLOT_A)).toBe(0);

        const rebook = await book(second.token);
        expect(rebook.status).toBe(201);
    });

    test('rescheduling into a taken slot fails and changes NOTHING', async () => {
        const first = await makeUser();
        const second = await makeUser();
        const mine = await book(first.token, { preferredTime: SLOT_A });
        await book(second.token, { preferredTime: SLOT_B });

        const res = await request(app)
            .put(`/api/bookings/${mine.body.booking.id}/reschedule`)
            .set('Authorization', `Bearer ${first.token}`)
            .send({ preferredDate: DATE, preferredTime: SLOT_B });

        expect(res.status).toBe(409);
        const unchanged = await Booking.findById(mine.body.booking.id);
        expect(unchanged.preferredTime).toBe(SLOT_A);
        expect(await slotCount(DATE, SLOT_A)).toBe(1);
        expect(await slotCount(DATE, SLOT_B)).toBe(1);
    });

    test('rescheduling into a free slot moves the reservation', async () => {
        const { token } = await makeUser();
        const mine = await book(token, { preferredTime: SLOT_A });

        const res = await request(app)
            .put(`/api/bookings/${mine.body.booking.id}/reschedule`)
            .set('Authorization', `Bearer ${token}`)
            .send({ preferredDate: DATE, preferredTime: SLOT_C });

        expect(res.status).toBe(200);
        expect(res.body.booking.preferredTime).toBe(SLOT_C);
        expect(res.body.booking.rescheduleCount).toBe(1);
        expect(await slotCount(DATE, SLOT_A)).toBe(0);
        expect(await slotCount(DATE, SLOT_C)).toBe(1);
    });

    test("a customer cannot cancel someone else's booking", async () => {
        const owner = await makeUser();
        const stranger = await makeUser();
        const created = await book(owner.token);

        const res = await request(app)
            .put(`/api/bookings/${created.body.booking.id}/cancel`)
            .set('Authorization', `Bearer ${stranger.token}`);
        expect(res.status).toBe(404);
        expect(await slotCount(DATE, SLOT_A)).toBe(1);
    });

    test('an expired payment hold releases the slot', async () => {
        const first = await makeUser();
        const second = await makeUser();
        const created = await book(first.token);

        await expireHold(created.body.booking.id);

        const booking = await Booking.findById(created.body.booking.id);
        expect(booking.status).toBe('cancelled');
        expect(booking.cancelledBy).toBe('system');
        expect(await slotCount(DATE, SLOT_A)).toBe(0);
        expect((await book(second.token)).status).toBe(201);
    });

    test('paid bookings cannot be changed within 24 hours of the visit', async () => {
        const { user, token } = await makeUser();
        const soon = await Booking.create({
            user: user._id,
            serviceSlug: 'artificial-grass',
            serviceName: 'Artificial Grass',
            areaSize: 100,
            address: '1 Garden Street',
            city: 'Delhi',
            preferredDate: toISTDateString(new Date()), // today
            preferredTime: SLOT_A,
            basePrice: 2000,
            areaPrice: 8500,
            totalPrice: 10500,
            status: 'confirmed',
            paymentId: 'pay_test',
        });

        const res = await request(app)
            .put(`/api/bookings/${soon._id}/cancel`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/24 hours/);
    });

    test('rejects past dates and unknown time slots', async () => {
        const { token } = await makeUser();
        expect((await book(token, { preferredDate: daysFromNow(-1) })).status).toBe(400);
        expect((await book(token, { preferredTime: '03:00 AM' })).status).toBe(400);
    });
});

describe('Payment arriving after the hold expired', () => {
    const setUpExpiredPaidBooking = async () => {
        const { user, token } = await makeUser();
        const created = await book(token);
        const bookingId = created.body.booking.id;
        await Payment.create({
            booking: bookingId,
            user: user._id,
            razorpayOrderId: `order_${bookingId}`,
            amount: created.body.booking.totalPrice,
        });
        await expireHold(bookingId);
        return { token, bookingId, orderId: `order_${bookingId}` };
    };

    const verify = (token, orderId, paymentId) => request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: razorpaySignature(orderId, paymentId),
        });

    test('slot still free → booking is re-confirmed', async () => {
        const { token, bookingId, orderId } = await setUpExpiredPaidBooking();

        const res = await verify(token, orderId, 'pay_late_1');
        expect(res.status).toBe(200);
        const booking = await Booking.findById(bookingId);
        expect(booking.status).toBe('confirmed');
        expect(await slotCount(DATE, SLOT_A)).toBe(1);
    });

    test('slot taken by someone else → stays cancelled and a refund is flagged', async () => {
        const { token, bookingId, orderId } = await setUpExpiredPaidBooking();
        const other = await makeUser();
        expect((await book(other.token)).status).toBe(201); // grabs the freed slot

        const res = await verify(token, orderId, 'pay_late_2');
        expect(res.status).toBe(409);
        const booking = await Booking.findById(bookingId);
        expect(booking.status).toBe('cancelled');
        expect(booking.refundStatus).toBe('pending');
        expect(booking.paymentId).toBe('pay_late_2');
        expect(await slotCount(DATE, SLOT_A)).toBe(1); // still only the other user
    });
});
