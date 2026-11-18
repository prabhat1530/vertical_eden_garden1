// ─────────────────────────────────────────────
// Email templates. Each returns { to, subject, html }.
// Customer-entered text (name, address) is HTML-escaped so it is shown as
// text and can't inject markup into the email.
// ─────────────────────────────────────────────
const { PAYMENT_HOLD_MINUTES } = require('../config/slots');

const escape = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const layout = (heading, color, body) => `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${color};">${heading}</h2>
        ${body}
        <p style="color: #94a3b8; font-size: 0.85rem;">Thank you for choosing Vertical Eden Garden!</p>
    </div>`;

const row = (label, value, style = '') =>
    `<tr><td style="padding:8px; color:#64748b;">${label}</td><td style="padding:8px; ${style}">${value}</td></tr>`;

const bookingTable = (b, extraRows = '') => `
    <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
        ${row('Service', escape(b.serviceName), 'font-weight:600;')}
        ${row('Date', escape(b.preferredDate))}
        ${row('Time', escape(b.preferredTime))}
        ${row('Area', `${b.areaSize} sq ft`)}
        ${row('Total', rupees(b.totalPrice), 'font-weight:700; color:#10b981;')}
        ${extraRows}
    </table>`;

const bookingReceived = (b, user) => ({
    to: user.email,
    subject: `Booking Received — ${b.serviceName}`,
    html: layout('🌿 Booking Received!', '#1e293b', `
        <p>Hi ${escape(user.name)},</p>
        <p>Your slot is reserved. Please complete payment within ${PAYMENT_HOLD_MINUTES} minutes to confirm it.</p>
        ${bookingTable(b)}`),
});

const paymentReceipt = (b, user) => ({
    to: user.email,
    subject: `Payment Receipt — ${rupees(b.totalPrice)}`,
    html: layout('✅ Payment Successful!', '#10b981', `
        <p>Hi ${escape(user.name)},</p>
        <p>Your payment has been verified and your booking is now confirmed. Your invoice is attached as a PDF.</p>
        ${bookingTable(b, row('Payment ID', escape(b.paymentId), 'font-size:0.85rem;'))}`),
});

const STATUS_MESSAGES = {
    confirmed: ['✅ Booking Confirmed', '#10b981', 'Your booking has been confirmed by our team. We look forward to seeing you!'],
    completed: ['🌿 Service Completed', '#2e7d32', 'Your service is complete. We hope you love your new green space! You can leave a review from My Bookings.'],
    cancelled: ['Booking Cancelled', '#b91c1c', 'Your booking has been cancelled.'],
};

const bookingStatusChanged = (b, user) => {
    const [heading, color, message] = STATUS_MESSAGES[b.status];
    const refund = b.status === 'cancelled' && b.refundStatus === 'pending'
        ? '<p>Your payment will be refunded to the original payment method within 5–7 working days.</p>'
        : '';
    return {
        to: user.email,
        subject: `${heading.replace(/^\W+\s*/, '')} — ${b.serviceName}`,
        html: layout(heading, color, `
            <p>Hi ${escape(user.name)},</p>
            <p>${message}</p>
            ${refund}
            ${bookingTable(b)}`),
    };
};

const bookingRescheduled = (b, user) => ({
    to: user.email,
    subject: `Booking Rescheduled — ${b.serviceName}`,
    html: layout('📅 Booking Rescheduled', '#6a1b9a', `
        <p>Hi ${escape(user.name)},</p>
        <p>Your booking has been moved to the new date and time below.</p>
        ${bookingTable(b)}`),
});

const passwordReset = ({ to, name, resetUrl }) => ({
    to,
    subject: 'Vertical Eden Garden — Password Reset',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">Password Reset</h2>
            <p>Hi ${escape(name)},</p>
            <p>You requested a password reset. Click the button below to set a new password:</p>
            <a href="${escape(resetUrl)}" style="display: inline-block; padding: 12px 24px; background: #1e293b; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
            <p style="color: #94a3b8; font-size: 0.85rem;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
        </div>`,
});

module.exports = {
    escape,
    STATUS_MESSAGES,
    bookingReceived,
    paymentReceipt,
    bookingStatusChanged,
    bookingRescheduled,
    passwordReset,
};
