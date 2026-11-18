const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// Processed webhook events (idempotency log).
// Razorpay retries a webhook until it gets a 2xx, so the same event can
// arrive more than once. Inserting the event id under a unique index is an
// atomic "claim": the first delivery inserts and is processed, any repeat
// hits a duplicate-key error and is skipped. Records expire after 30 days.
// ─────────────────────────────────────────────
const webhookEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
    },
    event: {
        type: String,
        required: true,
    },
    receivedAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30, // TTL: auto-delete after 30 days
    },
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
