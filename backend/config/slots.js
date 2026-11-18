// ─────────────────────────────────────────────
// Booking slot rules — one place for every scheduling policy.
// ─────────────────────────────────────────────

// The five daily visit windows offered in the booking form.
// startHour (24h, IST) is used for the "24 hours before" change cutoff.
const TIME_SLOTS = [
    { label: '09:00 - 11:00 AM', startHour: 9 },
    { label: '11:00 - 01:00 PM', startHour: 11 },
    { label: '01:00 - 03:00 PM', startHour: 13 },
    { label: '03:00 - 05:00 PM', startHour: 15 },
    { label: '05:00 - 07:00 PM', startHour: 17 },
];

// How many bookings one date + time window can take (1 = one team).
const SLOT_CAPACITY = parseInt(process.env.SLOT_CAPACITY || '1', 10);

// An unpaid booking holds its slot this long, then the slot is released.
const PAYMENT_HOLD_MINUTES = parseInt(process.env.PAYMENT_HOLD_MINUTES || '15', 10);

// Customers may cancel/reschedule a paid booking up to this long before the visit.
const CHANGE_CUTOFF_HOURS = 24;

// A booking can be rescheduled at most this many times.
const MAX_RESCHEDULES = 2;

// Furthest date that can be booked.
const MAX_DAYS_AHEAD = 90;

const TIMEZONE = 'Asia/Kolkata';

// 'YYYY-MM-DD' for a moment in time, in India time.
const toISTDateString = (date) => date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });

// When a slot starts, as a Date. Unknown (legacy) labels start at midnight.
const slotStartsAt = (dateStr, timeLabel) => {
    const slot = TIME_SLOTS.find((s) => s.label === timeLabel);
    const hour = String(slot ? slot.startHour : 0).padStart(2, '0');
    return new Date(`${dateStr}T${hour}:00:00+05:30`);
};

// Returns an error message, or null if the date + time can be booked.
const validateSlotChoice = (dateStr, timeLabel) => {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)
        || Number.isNaN(new Date(`${dateStr}T00:00:00Z`).getTime())) {
        return 'Please choose a valid date.';
    }
    const today = toISTDateString(new Date());
    const maxDate = toISTDateString(new Date(Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000));
    if (dateStr <= today) return 'Please choose a date from tomorrow onwards.';
    if (dateStr > maxDate) return `Bookings can be made up to ${MAX_DAYS_AHEAD} days ahead.`;
    if (!TIME_SLOTS.some((s) => s.label === timeLabel)) return 'Please choose a valid time slot.';
    return null;
};

module.exports = {
    TIME_SLOTS,
    SLOT_CAPACITY,
    PAYMENT_HOLD_MINUTES,
    CHANGE_CUTOFF_HOURS,
    MAX_RESCHEDULES,
    TIMEZONE,
    toISTDateString,
    slotStartsAt,
    validateSlotChoice,
};
