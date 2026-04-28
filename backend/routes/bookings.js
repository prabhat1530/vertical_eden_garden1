const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Service pricing configuration (same as frontend)
const SERVICE_PRICING = {
    'artificial-grass': { basePrice: 2000, perSqFt: 85 },
    'artificial-green-wall': { basePrice: 3000, perSqFt: 150 },
    'terrace-garden': { basePrice: 5000, perSqFt: 120 },
    'creepers-and-shrubs': { basePrice: 1500, perSqFt: 60 },
    'natural-vertical-garden': { basePrice: 4000, perSqFt: 200 },
    'plants-and-planters': { basePrice: 1000, perSqFt: 40 },
};

// ─────────────────────────────────────────────
// POST /api/bookings — Create a new booking
// ─────────────────────────────────────────────
router.post('/', [
    body('serviceSlug').notEmpty().withMessage('Service is required'),
    body('serviceName').notEmpty().withMessage('Service name is required'),
    body('areaSize').isInt({ min: 1 }).withMessage('Area size must be at least 1'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('preferredDate').notEmpty().withMessage('Preferred date is required'),
    body('preferredTime').notEmpty().withMessage('Preferred time is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg,
            });
        }

        const {
            serviceSlug, serviceName, areaSize,
            address, city, preferredDate, preferredTime,
            specialInstructions,
        } = req.body;

        // Calculate price server-side (don't trust client prices)
        const pricing = SERVICE_PRICING[serviceSlug];
        if (!pricing) {
            return res.status(400).json({
                success: false,
                error: 'Invalid service selected.',
            });
        }

        const basePrice = pricing.basePrice;
        const areaPrice = areaSize * pricing.perSqFt;
        const totalPrice = basePrice + areaPrice;

        const booking = await Booking.create({
            user: req.user._id,
            serviceSlug,
            serviceName,
            areaSize,
            address,
            city,
            preferredDate,
            preferredTime,
            specialInstructions: specialInstructions || '',
            basePrice,
            areaPrice,
            totalPrice,
            status: 'pending',
        });

        res.status(201).json({
            success: true,
            booking: {
                id: booking._id,
                serviceSlug: booking.serviceSlug,
                serviceName: booking.serviceName,
                areaSize: booking.areaSize,
                address: booking.address,
                city: booking.city,
                preferredDate: booking.preferredDate,
                preferredTime: booking.preferredTime,
                specialInstructions: booking.specialInstructions,
                basePrice: booking.basePrice,
                areaPrice: booking.areaPrice,
                totalPrice: booking.totalPrice,
                status: booking.status,
                createdAt: booking.createdAt,
            },
        });
    } catch (error) {
        console.error('Create booking error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error. Please try again.',
        });
    }
});

// ─────────────────────────────────────────────
// GET /api/bookings — Get current user's bookings
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            bookings: bookings.map(b => ({
                id: b._id,
                serviceSlug: b.serviceSlug,
                serviceName: b.serviceName,
                areaSize: b.areaSize,
                address: b.address,
                city: b.city,
                preferredDate: b.preferredDate,
                preferredTime: b.preferredTime,
                specialInstructions: b.specialInstructions,
                basePrice: b.basePrice,
                areaPrice: b.areaPrice,
                totalPrice: b.totalPrice,
                status: b.status,
                paymentId: b.paymentId,
                createdAt: b.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get bookings error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error.',
        });
    }
});

// ─────────────────────────────────────────────
// GET /api/bookings/:id — Get single booking
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found.',
            });
        }

        res.json({
            success: true,
            booking: {
                id: booking._id,
                serviceSlug: booking.serviceSlug,
                serviceName: booking.serviceName,
                areaSize: booking.areaSize,
                address: booking.address,
                city: booking.city,
                preferredDate: booking.preferredDate,
                preferredTime: booking.preferredTime,
                specialInstructions: booking.specialInstructions,
                basePrice: booking.basePrice,
                areaPrice: booking.areaPrice,
                totalPrice: booking.totalPrice,
                status: booking.status,
                paymentId: booking.paymentId,
                razorpayOrderId: booking.razorpayOrderId,
                createdAt: booking.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error.',
        });
    }
});

module.exports = router;
