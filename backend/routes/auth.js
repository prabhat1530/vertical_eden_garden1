const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Initialize Firebase Admin (Only projectId is needed for token verification)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'verticaledengarden-32475'
    });
}

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
// POST /api/auth/firebase-login — Authenticate via Firebase Phone Auth
// ─────────────────────────────────────────────
router.post('/firebase-login', [
    body('token').notEmpty().withMessage('Firebase token is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { token } = req.body;

        // 1. Verify the Firebase ID Token
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (verifyError) {
            console.error('Firebase token verification failed:', verifyError.message);
            return res.status(401).json({ success: false, error: 'Invalid or expired Firebase token.' });
        }

        const phone = decodedToken.phone_number;
        if (!phone) {
            return res.status(400).json({ success: false, error: 'No phone number associated with this token.' });
        }

        // 2. Find or Create User in MongoDB
        let user = await User.findOne({ phone });
        
        if (!user) {
            // New user signed in via Phone Auth
            user = new User({ 
                phone, 
                name: 'New User' 
            });
            await user.save({ validateBeforeSave: false });
        }

        // 3. Generate our custom backend JWT
        const jwtToken = generateToken(user._id);

        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email || '',
                phone: user.phone,
            },
        });

    } catch (error) {
        console.error('Firebase login error:', error.message);
        res.status(500).json({ success: false, error: 'Server error during Firebase login.' });
    }
});

module.exports = router;
