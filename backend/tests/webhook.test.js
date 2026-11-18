// Replace the real email sender with a counter (no emails leave the test).
jest.mock('../utils/sendEmail', () => jest.fn(() => Promise.resolve()));

const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Slot = require('../models/Slot');
const WebhookEvent = require('../models/WebhookEvent');
const { signAccessToken } = require('../utils/tokens');
const { toISTDateString } = require('../config/slots');

const DATE = toISTDateString(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
let counter = 0;

// A logged-in customer with a pending booking and a Razorpay order for it.
const setUpPendingBooking = async () => {
    counter += 1;
    const user = await User.create({
        name: `Payer ${counter}`,
        email: `payer${counter}@example.com`,
        phone: `91000${String(counter).padStart(5, '0')}`,
        password: 'secret1',
    });
    const token = signAccessToken(user);
    const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
            serviceSlug: 'artificial-grass',
            serviceName: 'Artificial Grass',
            areaSize: 100,
            address: '1 Garden Street',
            city: 'Delhi',
            preferredDate: DATE,
            preferredTime: ['09:00 - 11:00 AM', '11:00 - 01:00 PM', '01:00 - 03:00 PM', '03:00 - 05:00 PM', '05:00 - 07:00 PM'][counter % 5],
        });
    const booking = res.body.booking;
    const orderId = `order_wh_${counter}`;
    await Payment.create({ booking: booking.id, user: user._id, razorpayOrderId: orderId, amount: booking.totalPrice });
    return { user, token, booking, orderId };
};

const webhookBody = (event, { orderId, paymentId, amountPaise }) => JSON.stringify({
    event,
    payload: { payment: { entity: { id: paymentId, order_id: orderId, amount: amountPaise, status: 'captured' } } },
});

const sign = (raw, secret = process.env.RAZORPAY_WEBHOOK_SECRET) =>
    crypto.createHmac('sha256', secret).update(raw).digest('hex');

const postWebhook = (raw, { eventId, signature } = {}) => request(app)
    .post('/api/payments/webhook')
    .set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', signature || sign(raw))
    .set('X-Razorpay-Event-Id', eventId || `evt_${crypto.randomBytes(6).toString('hex')}`)
    .send(raw);

const receiptsSent = () => sendEmail.mock.calls.filter(([msg]) => msg.subject.startsWith('Payment Receipt')).length;

beforeAll(async () => {
    await Slot.init();
    await WebhookEvent.init();
});
beforeEach(() => sendEmail.mockClear());

describe('Razorpay webhook (Phase 3)', () => {
    test('confirms the booking even though the customer closed the tab (no /verify call)', async () => {
        const { booking, orderId } = await setUpPendingBooking();
        const raw = webhookBody('payment.captured', { orderId, paymentId: 'pay_tab_closed', amountPaise: booking.totalPrice * 100 });

        const res = await postWebhook(raw);

        expect(res.status).toBe(200);
        const saved = await Booking.findById(booking.id);
        expect(saved.status).toBe('confirmed');
        expect(saved.paymentId).toBe('pay_tab_closed');
        expect(saved.holdExpiresAt).toBeNull();
        expect((await Payment.findOne({ razorpayOrderId: orderId })).status).toBe('captured');
        expect(receiptsSent()).toBe(1);
    });

    test('rejects a forged webhook (wrong signature) and changes nothing', async () => {
        const { booking, orderId } = await setUpPendingBooking();
        const raw = webhookBody('payment.captured', { orderId, paymentId: 'pay_forged', amountPaise: booking.totalPrice * 100 });

        const res = await postWebhook(raw, { signature: sign(raw, 'attacker_guess') });

        expect(res.status).toBe(400);
        expect((await Booking.findById(booking.id)).status).toBe('pending');
    });

    test('rejects a body that was changed after signing', async () => {
        const { booking, orderId } = await setUpPendingBooking();
        const original = webhookBody('payment.captured', { orderId, paymentId: 'pay_x', amountPaise: 100 });
        const tampered = webhookBody('payment.captured', { orderId, paymentId: 'pay_x', amountPaise: booking.totalPrice * 100 });

        const res = await postWebhook(tampered, { signature: sign(original) });

        expect(res.status).toBe(400);
        expect((await Booking.findById(booking.id)).status).toBe('pending');
    });

    test('a repeated delivery of the same event is processed only once', async () => {
        const { booking, orderId } = await setUpPendingBooking();
        const raw = webhookBody('payment.captured', { orderId, paymentId: 'pay_dup', amountPaise: booking.totalPrice * 100 });

        const first = await postWebhook(raw, { eventId: 'evt_same' });
        const second = await postWebhook(raw, { eventId: 'evt_same' });

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        expect(second.body.duplicate).toBe(true);
        expect(await WebhookEvent.countDocuments({ eventId: 'evt_same' })).toBe(1);
        expect(receiptsSent()).toBe(1);
    });

    test('does not confirm when the paid amount does not match the booking', async () => {
        const { booking, orderId } = await setUpPendingBooking();
        const raw = webhookBody('payment.captured', { orderId, paymentId: 'pay_short', amountPaise: 100 });

        const res = await postWebhook(raw);

        expect(res.status).toBe(200); // handled (no point in Razorpay retrying)
        expect((await Booking.findById(booking.id)).status).toBe('pending');
    });

    test('browser verify and webhook arriving together send exactly ONE receipt', async () => {
        const { token, booking, orderId } = await setUpPendingBooking();
        const paymentId = 'pay_race';
        const raw = webhookBody('payment.captured', { orderId, paymentId, amountPaise: booking.totalPrice * 100 });
        const verifySignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const [hook, verify] = await Promise.all([
            postWebhook(raw),
            request(app)
                .post('/api/payments/verify')
                .set('Authorization', `Bearer ${token}`)
                .send({ razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: verifySignature }),
        ]);

        expect(hook.status).toBe(200);
        expect(verify.status).toBe(200);
        expect((await Booking.findById(booking.id)).status).toBe('confirmed');
        expect(receiptsSent()).toBe(1);
    });

    test('payment.failed marks the payment failed and keeps the slot held for a retry', async () => {
        const { booking, orderId } = await setUpPendingBooking();
        const raw = webhookBody('payment.failed', { orderId, paymentId: 'pay_declined', amountPaise: booking.totalPrice * 100 });

        const res = await postWebhook(raw);

        expect(res.status).toBe(200);
        expect((await Payment.findOne({ razorpayOrderId: orderId })).status).toBe('failed');
        expect((await Booking.findById(booking.id)).status).toBe('pending');
    });

    test('a late payment.failed never downgrades an already captured payment', async () => {
        const { booking, orderId } = await setUpPendingBooking();
        const amountPaise = booking.totalPrice * 100;

        await postWebhook(webhookBody('payment.captured', { orderId, paymentId: 'pay_ok', amountPaise }));
        await postWebhook(webhookBody('payment.failed', { orderId, paymentId: 'pay_ok', amountPaise }));

        expect((await Payment.findOne({ razorpayOrderId: orderId })).status).toBe('captured');
        expect((await Booking.findById(booking.id)).status).toBe('confirmed');
    });

    test('acknowledges events for orders that are not ours', async () => {
        const raw = webhookBody('payment.captured', { orderId: 'order_unknown', paymentId: 'pay_other', amountPaise: 5000 });
        const res = await postWebhook(raw);
        expect(res.status).toBe(200);
    });
});
