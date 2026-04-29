const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// Initialize Razorpay instance
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// ─────────────────────────────────────────────
// POST /api/payments/create-order
// Creates a Razorpay order for a booking
// ─────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                error: 'Booking ID is required.',
            });
        }

        // Find the booking and verify ownership
        const booking = await Booking.findOne({
            _id: bookingId,
            user: req.user._id,
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found.',
            });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({
                success: false,
                error: 'This booking is already paid.',
            });
        }

        // Create Razorpay order
        const razorpay = getRazorpayInstance();

        const order = await razorpay.orders.create({
            amount: Math.round(booking.totalPrice * 100), // Razorpay strictly expects integer paise
            currency: 'INR',
            receipt: `booking_${booking._id}`,
            notes: {
                bookingId: booking._id.toString(),
                userId: req.user._id.toString(),
                service: booking.serviceName,
            },
        });

        // Save the order ID to the booking
        booking.razorpayOrderId = order.id;
        await booking.save();

        // Create payment record
        await Payment.create({
            booking: booking._id,
            user: req.user._id,
            razorpayOrderId: order.id,
            amount: booking.totalPrice,
            currency: 'INR',
            status: 'created',
        });

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('Create order error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create payment order. Please try again.',
        });
    }
});

// ─────────────────────────────────────────────
// POST /api/payments/verify
// Verifies Razorpay payment signature (server-side)
// ─────────────────────────────────────────────
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Payment verification data is incomplete.',
            });
        }

        // Verify signature using HMAC SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            // Update payment status to failed
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: 'failed' }
            );

            return res.status(400).json({
                success: false,
                error: 'Payment verification failed. Signature mismatch.',
            });
        }

        // Payment is verified — update records
        // Update Payment
        await Payment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'captured',
            }
        );

        // Update Booking
        const booking = await Booking.findOneAndUpdate(
            {
                _id: bookingId,
                user: req.user._id,
            },
            {
                status: 'confirmed',
                paymentId: razorpay_payment_id,
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Payment verified successfully.',
            booking: booking ? {
                id: booking._id,
                status: booking.status,
                paymentId: booking.paymentId,
            } : null,
        });
    } catch (error) {
        console.error('Verify payment error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Payment verification failed. Please contact support.',
        });
    }
});

module.exports = router;
