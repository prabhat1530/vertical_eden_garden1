const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
    signAccessToken,
    issueRefreshToken,
    rotateRefreshToken,
    findValidRefreshToken,
    setRefreshCookie,
    clearRefreshCookie,
    REFRESH_COOKIE,
} = require('../utils/tokens');

const router = express.Router();

// OTP lockout policy
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_MINUTES = 15;

// Shape the public user object returned to the client.
const toPublicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email || '',
    phone: user.phone,
    role: user.role || 'user',
});

// Issue access token + refresh cookie, then send a consistent success response.
const sendAuthSuccess = async (res, req, user, status = 200) => {
    const accessToken = signAccessToken(user);
    const { raw, expiresAt } = await issueRefreshToken(user, req);
    setRefreshCookie(res, raw, expiresAt);
    return res.status(status).json({
        success: true,
        token: accessToken,       // access token (short-lived) — kept as `token` for the client
        user: toPublicUser(user),
    });
};

// ─────────────────────────────────────────────
// POST /api/auth/signup — Traditional Email Signup
// ─────────────────────────────────────────────
router.post('/signup', authLimiter, [
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

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, error: 'User already exists with this email' });
        }

        user = await User.create({ name, email, phone, password });

        return sendAuthSuccess(res, req, user, 201);
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ success: false, error: 'Server error during registration.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/login — Traditional Email Login
// ─────────────────────────────────────────────
router.post('/login', authLimiter, [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.password) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        return sendAuthSuccess(res, req, user);
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
        res.json({ success: true, user: toPublicUser(user) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/send-otp — Generate + send a HASHED OTP
// ─────────────────────────────────────────────
router.post('/send-otp', otpLimiter, [
    body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        let { phone } = req.body;
        phone = phone.replace(/\D/g, '');
        if (phone.length > 10 && phone.startsWith('91')) {
            phone = phone.slice(2);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone, name: 'New User' });
        }
        user.otp = otpHash;            // store HASH, never the raw code
        user.otpExpires = otpExpires;
        user.otpAttempts = 0;          // reset attempt counter for the new OTP
        user.otpLockUntil = undefined;
        await user.save({ validateBeforeSave: false });

        const fast2smsKey = process.env.FAST2SMS_API_KEY;
        if (fast2smsKey && fast2smsKey !== 'your_fast2sms_api_key_here') {
            try {
                const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                    method: 'POST',
                    headers: { 'authorization': fast2smsKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ route: 'otp', variables_values: otp, numbers: phone }),
                });
                const data = await response.json();
                console.log('Fast2SMS API response:', data);
            } catch (err) {
                console.error('Failed to call Fast2SMS API:', err.message);
            }
        } else {
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
// POST /api/auth/verify-otp — Verify OTP (hashed compare + lockout)
// ─────────────────────────────────────────────
router.post('/verify-otp', otpLimiter, [
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

        const user = await User.findOne({ phone })
            .select('+otp +otpExpires +otpAttempts +otpLockUntil');

        if (!user || !user.otp) {
            return res.status(400).json({ success: false, error: 'Please request a new OTP first' });
        }

        // Locked out from too many wrong attempts?
        if (user.otpLockUntil && user.otpLockUntil > new Date()) {
            const mins = Math.ceil((user.otpLockUntil - new Date()) / 60000);
            return res.status(429).json({
                success: false,
                error: `Too many incorrect attempts. Try again in ${mins} minute(s).`,
            });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, error: 'OTP has expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
                user.otpLockUntil = new Date(Date.now() + OTP_LOCK_MINUTES * 60 * 1000);
                user.otpAttempts = 0;
                await user.save({ validateBeforeSave: false });
                return res.status(429).json({
                    success: false,
                    error: `Too many incorrect attempts. Try again in ${OTP_LOCK_MINUTES} minutes.`,
                });
            }
            await user.save({ validateBeforeSave: false });
            const left = OTP_MAX_ATTEMPTS - user.otpAttempts;
            return res.status(400).json({ success: false, error: `Invalid OTP. ${left} attempt(s) left.` });
        }

        // Success — clear OTP state.
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        user.otpLockUntil = undefined;
        await user.save({ validateBeforeSave: false });

        return sendAuthSuccess(res, req, user);
    } catch (error) {
        console.error('Verify OTP error:', error.message);
        res.status(500).json({ success: false, error: 'Server error verifying OTP' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/refresh — Exchange refresh cookie for a new access token
// ─────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
    try {
        const raw = req.cookies?.[REFRESH_COOKIE];
        const doc = await findValidRefreshToken(raw);

        if (!doc || !doc.user) {
            return res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
        }

        // Rotate: revoke the used token and set a fresh one.
        const { raw: newRaw, expiresAt } = await rotateRefreshToken(doc, doc.user, req);
        setRefreshCookie(res, newRaw, expiresAt);

        res.json({
            success: true,
            token: signAccessToken(doc.user),
            user: toPublicUser(doc.user),
        });
    } catch (error) {
        console.error('Refresh token error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/logout — Revoke refresh token + clear cookie
// ─────────────────────────────────────────────
router.post('/logout', async (req, res) => {
    try {
        const raw = req.cookies?.[REFRESH_COOKIE];
        const doc = await findValidRefreshToken(raw);
        if (doc) {
            doc.revokedAt = new Date();
            await doc.save();
        }
        clearRefreshCookie(res);
        res.json({ success: true, message: 'Logged out.' });
    } catch (error) {
        console.error('Logout error:', error.message);
        clearRefreshCookie(res);
        res.json({ success: true, message: 'Logged out.' });
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

        res.json({ success: true, user: toPublicUser(user) });
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
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

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
router.put('/reset-password/:token', authLimiter, async (req, res) => {
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

        // Security: invalidate all existing sessions after a password reset.
        await RefreshToken.updateMany(
            { user: user._id, revokedAt: null },
            { revokedAt: new Date() }
        );

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

module.exports = router;
