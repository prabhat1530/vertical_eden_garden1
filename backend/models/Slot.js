const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// Slot — one document per (date, time window).
// bookedCount is only ever changed with a conditional atomic update
// ("increment only if bookedCount < capacity"), inside the same transaction
// that creates/moves/cancels the booking. The unique index guarantees there
// is exactly one Slot document per window to compete for.
// ─────────────────────────────────────────────
const slotSchema = new mongoose.Schema({
    date: {
        type: String,          // 'YYYY-MM-DD' (India time), same as Booking.preferredDate
        required: true,
    },
    time: {
        type: String,          // e.g. '09:00 - 11:00 AM', same as Booking.preferredTime
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
        min: 0,
    },
    bookedCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    bookings: [{
        // Which bookings hold this slot. Releasing filters on this, so
        // releasing the same booking twice can never decrement twice.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
    }],
}, { timestamps: true });

slotSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
