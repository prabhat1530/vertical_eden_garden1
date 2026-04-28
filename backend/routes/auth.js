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

        // Send via Authkey
        const authKey = process.env.AUTHKEY_API_KEY;
        const senderId = process.env.AUTHKEY_SENDER_ID || '12345';
        
        if (authKey) {
            // Authkey GET request format
            const authkeyUrl = `https://api.authkey.io/request?authkey=${authKey}&mobile=${phone}&country_code=91&sid=${senderId}&company=VerticalEden&otp=${otp}`;
            try {
                const response = await fetch(authkeyUrl);
                const data = await response.json();
                console.log('Authkey API response:', data);
            } catch (err) {
                console.error('Failed to call Authkey API:', err.message);
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

module.exports = router;
