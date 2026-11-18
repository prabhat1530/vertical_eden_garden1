require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// ─────────────────────────────────────────────
// DEV TOOL — pretend to be Razorpay and send a signed webhook to the local
// API, to demo "customer paid and closed the tab".
//
//   node scripts/simulate-webhook.js <bookingId>            payment.captured
//   node scripts/simulate-webhook.js <bookingId> --failed   payment.failed
//   node scripts/simulate-webhook.js <bookingId> --forged   wrong signature
//
// Creates a Payment (order) record for the booking if it has none, since
// real orders need Razorpay keys. Refuses to run in production.
// ─────────────────────────────────────────────

const [bookingId, ...flags] = process.argv.slice(2);
const API = `http://localhost:${process.env.PORT || 5001}/api/payments/webhook`;

(async () => {
    if (process.env.NODE_ENV === 'production') throw new Error('Refusing to run in production.');
    if (!bookingId) throw new Error('Usage: node scripts/simulate-webhook.js <bookingId> [--failed|--forged]');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not set in .env');

    await mongoose.connect(process.env.MONGO_URI);
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error(`No booking with id ${bookingId}`);

    let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
    if (!payment) {
        payment = await Payment.create({
            booking: booking._id,
            user: booking.user,
            razorpayOrderId: `order_sim_${booking._id}`,
            amount: booking.totalPrice,
        });
    }

    const event = flags.includes('--failed') ? 'payment.failed' : 'payment.captured';
    const paymentId = `pay_sim_${Date.now()}`;
    const raw = JSON.stringify({
        event,
        payload: {
            payment: {
                entity: {
                    id: paymentId,
                    order_id: payment.razorpayOrderId,
                    amount: Math.round(payment.amount * 100),
                    status: event === 'payment.failed' ? 'failed' : 'captured',
                },
            },
        },
    });
    const signature = flags.includes('--forged')
        ? 'forged-signature'
        : crypto.createHmac('sha256', secret).update(raw).digest('hex');

    console.log(`\nBooking ${booking._id}: status before = ${booking.status}`);
    console.log(`Sending ${event}${flags.includes('--forged') ? ' with a FORGED signature' : ''} for ₹${payment.amount}…`);

    const res = await fetch(API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': signature,
            'X-Razorpay-Event-Id': `evt_sim_${Date.now()}`,
        },
        body: raw,
    });
    console.log(`Webhook response: HTTP ${res.status} ${await res.text()}`);

    const after = await Booking.findById(booking._id);
    console.log(`Booking status after  = ${after.status}${after.paymentId ? ` (payment ${after.paymentId})` : ''}\n`);
    await mongoose.disconnect();
})().catch(async (err) => {
    console.error(`❌ ${err.message}`);
    await mongoose.disconnect();
    process.exit(1);
});
