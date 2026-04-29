const nodemailer = require('nodemailer');
require('dotenv').config();

const test = async () => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"Vertical Eden Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // send to themselves
            subject: 'Test Email From Server',
            text: 'If you see this, nodemailer works perfectly!',
        });

        console.log('Test email sent successfully:', info.messageId);
    } catch (err) {
        console.error('Failed to send email:', err.message);
    }
};

test();
