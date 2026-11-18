const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { ensureSlot, reserveSlot, releaseSlot, SlotUnavailableError } = require('./slotService');
const {
    PAYMENT_HOLD_MINUTES,
    CHANGE_CUTOFF_HOURS,
    MAX_RESCHEDULES,
    slotStartsAt,
    validateSlotChoice,
} = require('../config/slots');

// ─────────────────────────────────────────────
// Booking business actions. Every action that changes a slot runs in a
// MongoDB transaction: the booking change and the slot change are committed
// together or not at all. If two transactions touch the same documents at
// once, MongoDB aborts one with a "write conflict" and the driver re-runs it
// from the start, so the retry sees the fresh state.
// ─────────────────────────────────────────────

class BookingError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const runInTransaction = async (work) => {
    let result;
    await mongoose.connection.transaction(async (session) => {
        result = await work(session);
    });
    return result;
};

const findOwnBooking = (bookingId, userId, session) => {
    if (!mongoose.isValidObjectId(bookingId)) return null;
    const filter = { _id: bookingId };
    if (userId) filter.user = userId;
    return Booking.findOne(filter).session(session || null);
};

// Customers may change pending bookings any time, and paid bookings only
// until CHANGE_CUTOFF_HOURS before the visit.
const assertCustomerCanChange = (booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) {
        throw new BookingError(`A ${booking.status} booking can't be changed.`);
    }
    const cutoff = slotStartsAt(booking.preferredDate, booking.preferredTime).getTime()
        - CHANGE_CUTOFF_HOURS * 60 * 60 * 1000;
    if (booking.status === 'confirmed' && Date.now() > cutoff) {
        throw new BookingError(`Bookings can only be changed up to ${CHANGE_CUTOFF_HOURS} hours before the visit. Please contact us.`);
    }
};

// Release slots held by unpaid bookings whose hold has expired.
// Each booking is handled in its own transaction; the filter re-checks
// status + expiry so a payment that lands at the same moment wins cleanly.
const releaseExpiredHolds = async () => {
    const now = new Date();
    const expired = await Booking.find({
        status: 'pending',
        holdExpiresAt: { $ne: null, $lt: now },
    }).select('_id').limit(100).lean();

    let released = 0;
    for (const { _id } of expired) {
        try {
            await runInTransaction(async (session) => {
                const booking = await Booking.findOneAndUpdate(
                    { _id, status: 'pending', holdExpiresAt: { $lt: now } },
                    {
                        $set: {
                            status: 'cancelled',
                            cancelledAt: now,
                            cancelledBy: 'system',
                            cancelReason: 'Payment was not completed in time',
                            holdExpiresAt: null,
                        },
                    },
                    { new: true, session }
                );
                if (booking) {
                    await releaseSlot(booking.preferredDate, booking.preferredTime, booking._id, session);
                    released += 1;
                }
            });
        } catch (err) {
            console.error('Release hold error:', err.message);
        }
    }
    return released;
};

// Run releaseExpiredHolds every minute (not during tests).
const startHoldSweeper = (intervalMs = 60 * 1000) => {
    const timer = setInterval(() => {
        releaseExpiredHolds().catch((err) => console.error('Hold sweeper error:', err.message));
    }, intervalMs);
    timer.unref(); // don't keep the process alive just for this
    return timer;
};

// Create a pending booking and claim its slot, atomically.
const createBooking = async (data) => {
    const invalid = validateSlotChoice(data.preferredDate, data.preferredTime);
    if (invalid) throw new BookingError(invalid);

    await releaseExpiredHolds();
    await ensureSlot(data.preferredDate, data.preferredTime);

    return runInTransaction(async (session) => {
        const [booking] = await Booking.create([{
            ...data,
            status: 'pending',
            holdExpiresAt: new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000),
        }], { session });
        await reserveSlot(booking.preferredDate, booking.preferredTime, booking._id, session);
        return booking;
    });
};

// Cancel a booking and free its slot. `by` is 'user' or 'admin'.
const cancelBooking = async ({ bookingId, userId = null, by = 'user', reason = '' }) =>
    runInTransaction(async (session) => {
        const booking = await findOwnBooking(bookingId, userId, session);
        if (!booking) throw new BookingError('Booking not found.', 404);
        if (booking.status === 'cancelled') throw new BookingError('This booking is already cancelled.');
        if (by === 'user') assertCustomerCanChange(booking);

        const wasPaid = !!booking.paymentId && booking.status !== 'pending';
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancelledBy = by;
        booking.cancelReason = reason || (by === 'admin' ? 'Cancelled by admin' : 'Cancelled by customer');
        booking.holdExpiresAt = null;
        if (wasPaid) booking.refundStatus = 'pending';
        await booking.save({ session });

        await releaseSlot(booking.preferredDate, booking.preferredTime, booking._id, session);
        return booking;
    });

// Move a booking to a new date/time: claim the new slot, release the old one.
// If the new slot is taken, the whole transaction aborts and nothing changes.
const rescheduleBooking = async ({ bookingId, userId, preferredDate, preferredTime }) => {
    const invalid = validateSlotChoice(preferredDate, preferredTime);
    if (invalid) throw new BookingError(invalid);

    await ensureSlot(preferredDate, preferredTime);

    return runInTransaction(async (session) => {
        const booking = await findOwnBooking(bookingId, userId, session);
        if (!booking) throw new BookingError('Booking not found.', 404);
        assertCustomerCanChange(booking);
        if (booking.rescheduleCount >= MAX_RESCHEDULES) {
            throw new BookingError(`A booking can be rescheduled at most ${MAX_RESCHEDULES} times. Please contact us.`);
        }
        if (booking.preferredDate === preferredDate && booking.preferredTime === preferredTime) {
            throw new BookingError('Please pick a different date or time.');
        }

        await reserveSlot(preferredDate, preferredTime, booking._id, session);
        await releaseSlot(booking.preferredDate, booking.preferredTime, booking._id, session);

        booking.preferredDate = preferredDate;
        booking.preferredTime = preferredTime;
        booking.rescheduleCount += 1;
        await booking.save({ session });
        return booking;
    });
};

// Admin changes a booking's status, keeping slots consistent:
// cancelling frees the slot; reviving a cancelled booking re-claims it.
const setStatusByAdmin = async ({ bookingId, status }) => {
    if (status === 'cancelled') {
        return cancelBooking({ bookingId, by: 'admin' });
    }

    const current = await findOwnBooking(bookingId, null);
    if (!current) throw new BookingError('Booking not found.', 404);
    if (current.status === 'cancelled') {
        await ensureSlot(current.preferredDate, current.preferredTime);
    }

    return runInTransaction(async (session) => {
        const booking = await findOwnBooking(bookingId, null, session);
        if (booking.status === 'cancelled') {
            await reserveSlot(booking.preferredDate, booking.preferredTime, booking._id, session);
            booking.cancelledAt = null;
            booking.cancelledBy = null;
            booking.cancelReason = '';
        }
        booking.status = status;
        // Only customer checkouts expire; an admin-set status never does.
        booking.holdExpiresAt = null;
        await booking.save({ session });
        return booking;
    });
};

// Mark a booking paid. Safe to call more than once for the same payment
// (the client verify call and, later, the Razorpay webhook both use it).
// If the hold expired before the payment arrived, try to re-claim the slot;
// if someone else took it, keep the booking cancelled and flag a refund.
const confirmPaidBooking = async ({ bookingId, paymentId }) => {
    const booking = await findOwnBooking(bookingId, null);
    if (!booking) throw new BookingError('Booking not found.', 404);

    if (booking.status === 'confirmed' || booking.status === 'completed') {
        return { booking, alreadyConfirmed: booking.paymentId === paymentId };
    }

    if (booking.status === 'pending') {
        const updated = await Booking.findOneAndUpdate(
            { _id: booking._id, status: 'pending' },
            { $set: { status: 'confirmed', paymentId, holdExpiresAt: null } },
            { new: true }
        );
        // null means the sweeper cancelled it a moment ago — fall through.
        if (updated) return { booking: updated, alreadyConfirmed: false };
    }

    // Booking is cancelled (hold expired while the customer was paying).
    await ensureSlot(booking.preferredDate, booking.preferredTime);
    try {
        const revived = await runInTransaction(async (session) => {
            const fresh = await findOwnBooking(bookingId, null, session);
            if (fresh.status !== 'cancelled') return fresh;
            await reserveSlot(fresh.preferredDate, fresh.preferredTime, fresh._id, session);
            fresh.status = 'confirmed';
            fresh.paymentId = paymentId;
            fresh.holdExpiresAt = null;
            fresh.cancelledAt = null;
            fresh.cancelledBy = null;
            fresh.cancelReason = '';
            await fresh.save({ session });
            return fresh;
        });
        return { booking: revived, alreadyConfirmed: false };
    } catch (err) {
        if (!(err instanceof SlotUnavailableError)) throw err;
        await Booking.updateOne(
            { _id: booking._id },
            { $set: { paymentId, refundStatus: 'pending', cancelReason: 'Paid after the slot hold expired and the slot was taken' } }
        );
        throw new BookingError(
            'Your payment was received, but the slot was taken after your 15-minute hold expired. A full refund has been initiated.',
            409
        );
    }
};

module.exports = {
    BookingError,
    SlotUnavailableError,
    releaseExpiredHolds,
    startHoldSweeper,
    createBooking,
    cancelBooking,
    rescheduleBooking,
    setStatusByAdmin,
    confirmPaidBooking,
};
