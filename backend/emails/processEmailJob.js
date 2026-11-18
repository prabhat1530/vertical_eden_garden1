const { UnrecoverableError } = require('bullmq');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');
const { buildInvoicePdf, invoiceNumber } = require('../utils/invoicePdf');
const templates = require('./templates');

// ─────────────────────────────────────────────
// Runs one email job. Called by the queue worker (with retries) or directly
// when Redis is not available. Throwing makes the queue retry the job;
// returning means done (sent, or nothing to send).
// Jobs carry ids, not finished emails, so data is loaded fresh at send time.
// ─────────────────────────────────────────────

// DEV/DEMO ONLY: EMAIL_SIMULATE_FAILURES=N makes the first N attempts of every
// job fail, to show retries working. Ignored in production.
const simulatedFailure = (attemptsMade) => {
    const n = parseInt(process.env.EMAIL_SIMULATE_FAILURES || '0', 10);
    if (n > 0 && process.env.NODE_ENV !== 'production' && attemptsMade < n) {
        throw new Error(`Simulated SMTP failure (attempt ${attemptsMade + 1} of ${n} set to fail)`);
    }
};

const loadBooking = async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate('user', 'name email phone');
    // Nothing to send: booking deleted, or customer has no email (OTP-only).
    if (!booking || !booking.user || !booking.user.email) return null;
    return booking;
};

const processEmailJob = async (job) => {
    const { name, data } = job;
    simulatedFailure(job.attemptsMade || 0);

    switch (name) {
        case 'booking-received': {
            const b = await loadBooking(data.bookingId);
            if (!b) return 'skipped';
            await sendEmail(templates.bookingReceived(b, b.user));
            return 'sent';
        }

        case 'payment-receipt': {
            const b = await loadBooking(data.bookingId);
            if (!b) return 'skipped';
            const pdf = await buildInvoicePdf({ booking: b, user: b.user });
            await sendEmail({
                ...templates.paymentReceipt(b, b.user),
                attachments: [{ filename: `${invoiceNumber(b)}.pdf`, content: pdf, contentType: 'application/pdf' }],
            });
            return 'sent';
        }

        case 'booking-status': {
            const b = await loadBooking(data.bookingId);
            // Skip if the status changed again before this job ran.
            if (!b || b.status !== data.status || !templates.STATUS_MESSAGES[b.status]) return 'skipped';
            await sendEmail(templates.bookingStatusChanged(b, b.user));
            return 'sent';
        }

        case 'booking-rescheduled': {
            const b = await loadBooking(data.bookingId);
            if (!b) return 'skipped';
            await sendEmail(templates.bookingRescheduled(b, b.user));
            return 'sent';
        }

        case 'password-reset': {
            await sendEmail(templates.passwordReset(data));
            return 'sent';
        }

        default:
            // Retrying can't fix an unknown job type.
            throw new UnrecoverableError(`Unknown email job: ${name}`);
    }
};

module.exports = { processEmailJob };
