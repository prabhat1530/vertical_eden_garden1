const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

// ─────────────────────────────────────────────
// GET /api/admin/stats — Dashboard statistics
// ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const completedBookings = await Booking.countDocuments({ status: 'completed' });

        // Calculate total revenue from confirmed + completed bookings
        const revenueResult = await Booking.aggregate([
            { $match: { status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Recent bookings (latest 5)
        const recentBookings = await Booking.find()
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalBookings,
                pendingBookings,
                confirmedBookings,
                completedBookings,
                totalRevenue,
            },
            recentBookings: recentBookings.map(b => ({
                id: b._id,
                serviceName: b.serviceName,
                totalPrice: b.totalPrice,
                status: b.status,
                preferredDate: b.preferredDate,
                createdAt: b.createdAt,
                user: b.user ? {
                    name: b.user.name,
                    email: b.user.email,
                    phone: b.user.phone,
                } : null,
            })),
        });
    } catch (error) {
        console.error('Admin stats error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// GET /api/admin/bookings — All bookings
// ─────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email phone')
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
                user: b.user ? {
                    id: b.user._id,
                    name: b.user.name,
                    email: b.user.email,
                    phone: b.user.phone,
                } : null,
            })),
        });
    } catch (error) {
        console.error('Admin bookings error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/admin/bookings/:id/status — Update booking status
// ─────────────────────────────────────────────
router.put('/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('user', 'name email phone');

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }

        res.json({
            success: true,
            booking: {
                id: booking._id,
                serviceName: booking.serviceName,
                status: booking.status,
                totalPrice: booking.totalPrice,
                user: booking.user ? {
                    name: booking.user.name,
                    email: booking.user.email,
                } : null,
            },
        });
    } catch (error) {
        console.error('Update booking status error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ─────────────────────────────────────────────
// GET /api/admin/users — All users
// ─────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        // Get booking count per user
        const bookingCounts = await Booking.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        bookingCounts.forEach(item => {
            countMap[item._id.toString()] = item.count;
        });

        res.json({
            success: true,
            count: users.length,
            users: users.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email || '',
                phone: u.phone,
                role: u.role,
                bookingCount: countMap[u._id.toString()] || 0,
                createdAt: u.createdAt,
            })),
        });
    } catch (error) {
        console.error('Admin users error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

module.exports = router;
