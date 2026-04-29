const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// ─────────────────────────────────────────────
// POST /api/auth/signup — Traditional Email Signup
// ─────────────────────────────────────────────
router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { name, email, phone, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, error: 'User already exists with this email' });
        }

        user = await User.create({
            name,
            email,
            phone,
            password,
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ success: false, error: 'Server error during registration.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/login — Traditional Email Login
// ─────────────────────────────────────────────
router.post('/login', [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, error: 'Server error during login.' });
    }
});

// ─────────────────────────────────────────────
// GET /api/auth/me — Get Current Logged-in User
// ─────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role || 'user',
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/send-otp — Generate and send OTP via Authkey
// ─────────────────────────────────────────────
router.post('/send-otp', [
    body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        let { phone } = req.body;
        // Clean phone number
        phone = phone.replace(/\D/g, '');
        if (phone.length > 10 && phone.startsWith('91')) {
            phone = phone.slice(2);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to DB
        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone, name: 'New User' });
        }
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save({ validateBeforeSave: false });

        // Send via Fast2SMS
        const fast2smsKey = process.env.FAST2SMS_API_KEY;
        
        if (fast2smsKey && fast2smsKey !== 'your_fast2sms_api_key_here') {
            try {
                const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                    method: 'POST',
                    headers: {
                        'authorization': fast2smsKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        route: 'otp',
                        variables_values: otp,
                        numbers: phone
                    })
                });
                const data = await response.json();
                console.log('Fast2SMS API response:', data);
            } catch (err) {
                console.error('Failed to call Fast2SMS API:', err.message);
                // Continue anyway so they don't get blocked
            }
        } else {
            // Simulation mode
            console.log(`\n=== 🚀 SIMULATION MODE 🚀 ===`);
            console.log(`Sending OTP to ${phone}: ${otp}`);
            console.log(`==============================\n`);
        }

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error.message);
        res.status(500).json({ success: false, error: 'Server error sending OTP' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/verify-otp — Verify Authkey OTP
// ─────────────────────────────────────────────
router.post('/verify-otp', [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        let { phone, otp } = req.body;
        phone = phone.replace(/\D/g, '');
        if (phone.length > 10 && phone.startsWith('91')) {
            phone = phone.slice(2);
        }

        const user = await User.findOne({ phone }).select('+otp +otpExpires');
        
        if (!user || !user.otp) {
            return res.status(400).json({ success: false, error: 'Please request a new OTP first' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, error: 'OTP has expired' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid OTP' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email || '',
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error('Verify OTP error:', error.message);
        res.status(500).json({ success: false, error: 'Server error verifying OTP' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/auth/profile — Update profile
// ─────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role || 'user',
            },
        });
    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ success: false, error: 'Server error updating profile.' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/auth/change-password — Change password
// ─────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Both current and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user.password) {
            return res.status(400).json({ success: false, error: 'Cannot change password for OTP-only accounts.' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password — Send reset link
// ─────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save({ validateBeforeSave: false });

        // Build reset URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        // Send email
        const sendEmail = require('../utils/sendEmail');
        await sendEmail({
            to: user.email,
            subject: 'Vertical Eden Garden — Password Reset',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1e293b;">Password Reset</h2>
                    <p>Hi ${user.name},</p>
                    <p>You requested a password reset. Click the button below to set a new password:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1e293b; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
                    <p style="color: #94a3b8; font-size: 0.85rem;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
                </div>
            `,
        });

        res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/auth/reset-password/:token — Reset password
// ─────────────────────────────────────────────
router.put('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
        }

        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        }).select('+resetPasswordToken +resetPasswordExpire');

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

module.exports = router;
