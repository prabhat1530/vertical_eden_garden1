const nodemailer = require('nodemailer');

// One SMTP transporter, created on first use and reused for every email.
let transporter = null;

const getTransporter = (user, pass) => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
        });
    }
    return transporter;
};

// Sends one email. Throws if sending fails, so the email queue can retry it.
// attachments: [{ filename, content (Buffer), contentType }]
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass || emailUser === 'your_gmail_here@gmail.com') {
        console.log(`\n=== 📧 EMAIL SIMULATION ===`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        if (attachments.length) {
            console.log(`Attachments: ${attachments.map((a) => `${a.filename} (${a.content.length} bytes)`).join(', ')}`);
        }
        console.log(`Body: ${html.substring(0, 200)}...`);
        console.log(`=============================\n`);
        return;
    }

    await getTransporter(emailUser, emailPass).sendMail({
        from: `"Vertical Eden Garden" <${emailUser}>`,
        to,
        subject,
        html,
        attachments,
    });
};

module.exports = sendEmail;
