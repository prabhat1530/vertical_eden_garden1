const Slot = require('../models/Slot');
const { TIME_SLOTS, SLOT_CAPACITY } = require('../config/slots');

// ─────────────────────────────────────────────
// Slot primitives. reserveSlot/releaseSlot take a session so callers can run
// them inside the same MongoDB transaction as the booking change.
// ─────────────────────────────────────────────

class SlotUnavailableError extends Error {
    constructor() {
        super('This time slot is already booked. Please choose another one.');
        this.status = 409;
    }
}

// Make sure the Slot document exists. Called BEFORE a transaction starts:
// it is idempotent, and if two requests race to create the same slot the
// unique index lets only one insert succeed — the other's duplicate-key
// error is harmless and ignored.
const ensureSlot = async (date, time) => {
    try {
        await Slot.updateOne(
            { date, time },
            { $setOnInsert: { capacity: SLOT_CAPACITY, bookedCount: 0, bookings: [] } },
            { upsert: true }
        );
    } catch (err) {
        if (err.code !== 11000) throw err;
    }
};

// Atomically claim one place in the slot. The filter only matches while
// bookedCount < capacity, so of two simultaneous requests for the last place
// exactly one matches; the other gets null and is rejected.
const reserveSlot = async (date, time, bookingId, session) => {
    const slot = await Slot.findOneAndUpdate(
        { date, time, $expr: { $lt: ['$bookedCount', '$capacity'] } },
        { $inc: { bookedCount: 1 }, $addToSet: { bookings: bookingId } },
        { new: true, session }
    );
    if (!slot) throw new SlotUnavailableError();
    return slot;
};

// Give back the place held by this booking. Matching on `bookings` makes it
// idempotent, and bookings made before slots existed simply match nothing.
const releaseSlot = (date, time, bookingId, session) =>
    Slot.updateOne(
        { date, time, bookings: bookingId },
        { $inc: { bookedCount: -1 }, $pull: { bookings: bookingId } },
        { session }
    );

// Availability of every time window on a date.
const getAvailability = async (date) => {
    const slots = await Slot.find({ date }).lean();
    return TIME_SLOTS.map(({ label }) => {
        const slot = slots.find((s) => s.time === label);
        const capacity = slot ? slot.capacity : SLOT_CAPACITY;
        const booked = slot ? slot.bookedCount : 0;
        return {
            time: label,
            capacity,
            booked,
            available: booked < capacity,
        };
    });
};

module.exports = {
    SlotUnavailableError,
    ensureSlot,
    reserveSlot,
    releaseSlot,
    getAvailability,
};
