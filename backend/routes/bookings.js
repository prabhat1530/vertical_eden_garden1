const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');
const { enqueueEmail } = require('../queues/emailQueue');
const { getAvailability } = require('../services/slotService');
const {
    BookingError,
    SlotUnavailableError,
    releaseExpiredHolds,
    createBooking,
    cancelBooking,
    rescheduleBooking,
} = require('../services/bookingService');

const router = express.Router();

// Service pricing configuration (same as frontend)
const SERVICE_PRICING = {
    'artificial-grass': { basePrice: 2000, perSqFt: 85 },
    'artificial-green-wall': { basePrice: 3000, perSqFt: 150 },
    'terrace-garden': { basePrice: 5000, perSqFt: 120 },
    'creepers-and-shrubs': { basePrice: 1500, perSqFt: 60 },
    'natural-vertical-garden': { basePrice: 4000, perSqFt: 200 },
    'plants-and-planters': { basePrice: 1000, perSqFt: 40 },
};

// Shape a booking for API responses.
const toClient = (b) => ({
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
    holdExpiresAt: b.holdExpiresAt,
    cancelledBy: b.cancelledBy,
    cancelReason: b.cancelReason,
    refundStatus: b.refundStatus,
    rescheduleCount: b.rescheduleCount,
    createdAt: b.createdAt,
});

// Turn service errors into HTTP responses.
const handleError = (res, error, fallback) => {
    if (error instanceof BookingError || error instanceof SlotUnavailableError) {
        return res.status(error.status).json({ success: false, error: error.message });
    }
    console.error(`${fallback}:`, error.message);
    return res.status(500).json({ success: false, error: 'Server error. Please try again.' });
};

const firstValidationError = (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return false;
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return true;
};

// ─────────────────────────────────────────────
// GET /api/bookings/slots?date=YYYY-MM-DD — Public slot availability
// ─────────────────────────────────────────────
router.get('/slots', [
    query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
], async (req, res) => {
    try {
        if (firstValidationError(req, res)) return;
        await releaseExpiredHolds();
        const slots = await getAvailability(req.query.date);
        res.json({ success: true, date: req.query.date, slots });
    } catch (error) {
        handleError(res, error, 'Slot availability error');
    }
});

// Everything below requires a logged-in user.
router.use(protect);

// ─────────────────────────────────────────────
// POST /api/bookings — Create a booking and hold its slot
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
        if (firstValidationError(req, res)) return;

        const {
            serviceSlug, serviceName, areaSize,
            address, city, preferredDate, preferredTime,
            specialInstructions,
        } = req.body;

        // Calculate price server-side (don't trust client prices)
        const pricing = SERVICE_PRICING[serviceSlug];
        if (!pricing) {
            return res.status(400).json({ success: false, error: 'Invalid service selected.' });
        }

        const basePrice = pricing.basePrice;
        const areaPrice = areaSize * pricing.perSqFt;
        const totalPrice = basePrice + areaPrice;

        const booking = await createBooking({
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
        });

        // Queue the "booking received" email (retried if sending fails)
        enqueueEmail('booking-received', { bookingId: String(booking._id) });

        res.status(201).json({ success: true, booking: toClient(booking) });
    } catch (error) {
        handleError(res, error, 'Create booking error');
    }
});

// ─────────────────────────────────────────────
// GET /api/bookings — Get current user's bookings
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        // Free expired holds first so statuses shown are up to date.
        await releaseExpiredHolds();
        const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, count: bookings.length, bookings: bookings.map(toClient) });
    } catch (error) {
        handleError(res, error, 'Get bookings error');
    }
});

// ─────────────────────────────────────────────
// GET /api/bookings/:id — Get single booking
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }
        res.json({ success: true, booking: { ...toClient(booking), razorpayOrderId: booking.razorpayOrderId } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/bookings/:id/cancel — Customer cancels; slot is freed
// ─────────────────────────────────────────────
router.put('/:id/cancel', async (req, res) => {
    try {
        const booking = await cancelBooking({
            bookingId: req.params.id,
            userId: req.user._id,
            by: 'user',
            reason: (req.body && req.body.reason) || '',
        });
        enqueueEmail('booking-status', { bookingId: String(booking._id), status: 'cancelled' });
        res.json({ success: true, booking: toClient(booking) });
    } catch (error) {
        handleError(res, error, 'Cancel booking error');
    }
});

// ─────────────────────────────────────────────
// PUT /api/bookings/:id/reschedule — Move to a new date/time slot
// ─────────────────────────────────────────────
router.put('/:id/reschedule', [
    body('preferredDate').notEmpty().withMessage('New date is required'),
    body('preferredTime').notEmpty().withMessage('New time is required'),
], async (req, res) => {
    try {
        if (firstValidationError(req, res)) return;
        const booking = await rescheduleBooking({
            bookingId: req.params.id,
            userId: req.user._id,
            preferredDate: req.body.preferredDate,
            preferredTime: req.body.preferredTime,
        });
        enqueueEmail('booking-rescheduled', { bookingId: String(booking._id) });
        res.json({ success: true, booking: toClient(booking) });
    } catch (error) {
        handleError(res, error, 'Reschedule booking error');
    }
});

module.exports = router;
