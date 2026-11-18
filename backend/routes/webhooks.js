const express = require('express');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const WebhookEvent = require('../models/WebhookEvent');
const {
    confirmPaidBooking,
    BookingError,
    SlotUnavailableError,
} = require('../services/bookingService');
const { enqueueEmail } = require('../queues/emailQueue');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/payments/webhook — Razorpay server-to-server notifications
//
// Confirms bookings even when the customer closed the tab before the
// browser could call /payments/verify.
//   1. Authenticity: HMAC-SHA256 of the RAW request body with the webhook
//      secret must equal the X-Razorpay-Signature header (constant-time
//      compare). The raw bytes are needed, so this route is mounted before
//      express.json() in server.js.
//   2. Idempotency: the event id is claimed in WebhookEvent (unique index);
//      repeat deliveries are acknowledged without reprocessing.
//   3. Integrity: the captured amount must match our Payment record.
// Respond 2xx once handled (Razorpay stops retrying); 5xx on our own errors
// so Razorpay retries later.
// ─────────────────────────────────────────────

const isValidSignature = (rawBody, signature, secret) => {
    if (!signature || !secret) return false;
    const expected = Buffer.from(
        crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    );
    const received = Buffer.from(String(signature));
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

// payment.captured / order.paid → confirm the booking.
const handlePaid = async (entity) => {
    if (!entity || !entity.order_id) return;

    const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
    if (!payment) {
        console.warn(`Webhook: unknown order ${entity.order_id} — ignored`);
        return;
    }

    // Our Payment.amount is in rupees; Razorpay amounts are in paise.
    if (Math.round(payment.amount * 100) !== entity.amount) {
        console.error(`Webhook: amount mismatch for ${entity.order_id} — expected ${Math.round(payment.amount * 100)}, got ${entity.amount}. Not confirming.`);
        return;
    }

    await Payment.updateOne(
        { _id: payment._id },
        { $set: { razorpayPaymentId: entity.id, status: 'captured' } }
    );

    try {
        const { booking, alreadyConfirmed } = await confirmPaidBooking({
            bookingId: payment.booking,
            paymentId: entity.id,
        });
        if (!alreadyConfirmed) {
            enqueueEmail('payment-receipt', { bookingId: String(booking._id) });
        }
    } catch (err) {
        // Expected business outcome (e.g. hold expired and the slot was
        // taken — refund flagged). Handled, so acknowledge the webhook.
        if (err instanceof BookingError || err instanceof SlotUnavailableError) {
            console.warn(`Webhook: ${err.message}`);
            return;
        }
        throw err;
    }
};

// payment.failed → record it (never downgrade a captured payment). The
// booking stays pending so the customer can retry within the hold.
const handleFailed = async (entity) => {
    if (!entity || !entity.order_id) return;
    await Payment.updateOne(
        { razorpayOrderId: entity.order_id, status: { $ne: 'captured' } },
        { $set: { razorpayPaymentId: entity.id, status: 'failed' } }
    );
};

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('Webhook: RAZORPAY_WEBHOOK_SECRET is not set');
        return res.status(500).json({ success: false, error: 'Webhook not configured.' });
    }

    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody) || !isValidSignature(rawBody, req.headers['x-razorpay-signature'], secret)) {
        return res.status(400).json({ success: false, error: 'Invalid signature.' });
    }

    let payload;
    try {
        payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
        return res.status(400).json({ success: false, error: 'Invalid JSON.' });
    }

    const event = payload.event;
    const entity = payload.payload && payload.payload.payment && payload.payload.payment.entity;
    const eventId = req.headers['x-razorpay-event-id'] || `${event}:${entity && entity.id}`;

    // Claim the event; a duplicate delivery fails the unique index.
    try {
        await WebhookEvent.create({ eventId, event });
    } catch (err) {
        if (err.code === 11000) return res.json({ success: true, duplicate: true });
        console.error('Webhook claim error:', err.message);
        return res.status(500).json({ success: false });
    }

    try {
        if (event === 'payment.captured' || event === 'order.paid') {
            await handlePaid(entity);
        } else if (event === 'payment.failed') {
            await handleFailed(entity);
        }
        // Any other event type is acknowledged and ignored.
        return res.json({ success: true });
    } catch (err) {
        // Un-claim so Razorpay's retry gets processed.
        await WebhookEvent.deleteOne({ eventId }).catch(() => {});
        console.error('Webhook processing error:', err.message);
        return res.status(500).json({ success: false });
    }
});

module.exports = router;
