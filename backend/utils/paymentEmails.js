const sendEmail = require('./sendEmail');

// ─────────────────────────────────────────────
// Payment receipt email, shared by the browser verify call and the
// Razorpay webhook so both send the exact same message.
// Non-blocking: failures are logged, never thrown to the caller.
// ─────────────────────────────────────────────
const sendPaymentReceipt = (user, booking, paymentId) => {
    if (!user || !user.email || !booking) return;

    sendEmail({
        to: user.email,
        subject: `Payment Receipt — ₹${booking.totalPrice.toLocaleString()}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">✅ Payment Successful!</h2>
                <p>Hi ${user.name},</p>
                <p>Your payment has been verified and your booking is now confirmed.</p>
                <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
                    <tr><td style="padding:8px; color:#64748b;">Service</td><td style="padding:8px; font-weight:600;">${booking.serviceName}</td></tr>
                    <tr><td style="padding:8px; color:#64748b;">Date</td><td style="padding:8px;">${booking.preferredDate}, ${booking.preferredTime}</td></tr>
                    <tr><td style="padding:8px; color:#64748b;">Amount</td><td style="padding:8px; font-weight:700; color:#10b981;">₹${booking.totalPrice.toLocaleString()}</td></tr>
                    <tr><td style="padding:8px; color:#64748b;">Payment ID</td><td style="padding:8px; font-size:0.85rem;">${paymentId}</td></tr>
                </table>
                <p style="color: #94a3b8; font-size: 0.85rem;">Thank you for choosing Vertical Eden Garden!</p>
            </div>
        `,
    }).catch((err) => console.error('Payment email error:', err.message));
};

module.exports = { sendPaymentReceipt };
