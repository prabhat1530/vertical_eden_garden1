const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/reviews — Create a review
// ─────────────────────────────────────────────
router.post('/', protect, [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().withMessage('Comment is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { bookingId, rating, comment } = req.body;

        // Verify booking belongs to user and is completed
        const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({ success: false, error: 'You can only review completed bookings.' });
        }

        // Check if already reviewed
        const existing = await Review.findOne({ booking: bookingId });
        if (existing) {
            return res.status(400).json({ success: false, error: 'You have already reviewed this booking.' });
        }

        const review = await Review.create({
            user: req.user._id,
            booking: bookingId,
            serviceSlug: booking.serviceSlug,
            rating,
            comment,
        });

        res.status(201).json({
            success: true,
            review: {
                id: review._id,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
            },
        });
    } catch (error) {
        console.error('Create review error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// GET /api/reviews/:serviceSlug — Get reviews for a service
// ─────────────────────────────────────────────
router.get('/:serviceSlug', async (req, res) => {
    try {
        const reviews = await Review.find({ serviceSlug: req.params.serviceSlug })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        // Calculate average
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        res.json({
            success: true,
            count: reviews.length,
            averageRating: Number(averageRating),
            reviews: reviews.map(r => ({
                id: r._id,
                rating: r.rating,
                comment: r.comment,
                userName: r.user?.name || 'Anonymous',
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get reviews error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

module.exports = router;
