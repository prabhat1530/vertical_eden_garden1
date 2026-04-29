const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass || emailUser === 'your_gmail_here@gmail.com') {
        console.log(`\n=== 📧 EMAIL SIMULATION ===`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html.substring(0, 200)}...`);
        console.log(`=============================\n`);
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });

    await transporter.sendMail({
        from: `"Vertical Eden Garden" <${emailUser}>`,
        to,
        subject,
        html,
    });
};

module.exports = sendEmail;
