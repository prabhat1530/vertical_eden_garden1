const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { setStatusByAdmin, BookingError, SlotUnavailableError } = require('../services/bookingService');
const { enqueueEmail, getEmailQueueStats, retryFailedEmails } = require('../queues/emailQueue');
const { cached, CACHE_KEYS } = require('../utils/cache');
const { TIMEZONE, toISTDateString } = require('../config/slots');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

// ─────────────────────────────────────────────
// GET /api/admin/stats — Dashboard statistics
// ─────────────────────────────────────────────
const CHART_MONTHS = 6;
const PAID_STATUSES = ['confirmed', 'completed'];

// The last CHART_MONTHS months in India time, oldest first: ['2026-06', …, '2026-11'].
const recentMonths = () => {
    const [year, month] = toISTDateString(new Date()).split('-').map(Number);
    return Array.from({ length: CHART_MONTHS }, (_, i) => {
        const d = new Date(Date.UTC(year, month - CHART_MONTHS + i, 1));
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    });
};

// Chart data, computed by MongoDB ($group) rather than by loading every booking.
// Months are by booking date (createdAt) in India time; revenue counts only
// paid bookings, matching totalRevenue.
const chartQueries = () => {
    const months = recentMonths();
    const since = new Date(`${months[0]}-01T00:00:00+05:30`);
    return {
        months,
        queries: [
            Booking.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIMEZONE } },
                        bookings: { $sum: 1 },
                        revenue: { $sum: { $cond: [{ $in: ['$status', PAID_STATUSES] }, '$totalPrice', 0] } },
                    },
                },
            ]),
            Booking.aggregate([
                { $group: { _id: '$serviceName', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
            ]),
            Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ],
    };
};

const buildCharts = (months, monthlyRows, serviceRows, statusRows) => {
    const byMonth = Object.fromEntries(monthlyRows.map((r) => [r._id, r]));
    const byStatus = Object.fromEntries(statusRows.map((r) => [r._id, r.count]));
    return {
        // Every month is present, with zeros for months that had no bookings.
        monthly: months.map((m) => ({
            month: m,
            bookings: byMonth[m] ? byMonth[m].bookings : 0,
            revenue: byMonth[m] ? byMonth[m].revenue : 0,
        })),
        byService: serviceRows.map((r) => ({ service: r._id, count: r.count })),
        byStatus: ['pending', 'confirmed', 'completed', 'cancelled']
            .map((status) => ({ status, count: byStatus[status] || 0 })),
    };
};

// Computes the dashboard numbers and charts. The queries are independent, so
// they run in parallel instead of one after another.
const computeAdminStats = async () => {
    const { months, queries } = chartQueries();
    const [
        totalUsers, totalBookings, pendingBookings, confirmedBookings, completedBookings,
        revenueResult, recentBookings, monthlyRows, serviceRows, statusRows,
    ] = await Promise.all([
        User.countDocuments(),
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'pending' }),
        Booking.countDocuments({ status: 'confirmed' }),
        Booking.countDocuments({ status: 'completed' }),
        // Total revenue from confirmed + completed bookings
        Booking.aggregate([
            { $match: { status: { $in: PAID_STATUSES } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        // Recent bookings (latest 5)
        Booking.find().populate('user', 'name email phone').sort({ createdAt: -1 }).limit(5),
        ...queries,
    ]);

    return {
        stats: {
            totalUsers,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
        },
        charts: buildCharts(months, monthlyRows, serviceRows, statusRows),
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
    };
};

router.get('/stats', async (req, res) => {
    try {
        // Cached in Redis for 60 s; cleared early whenever a booking changes.
        const { value, status } = await cached(CACHE_KEYS.adminStats, 60, computeAdminStats);
        res.set('X-Cache', status);
        res.json({ success: true, ...value });
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
                cancelledBy: b.cancelledBy,
                cancelReason: b.cancelReason,
                refundStatus: b.refundStatus,
                rescheduleCount: b.rescheduleCount,
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

        // Goes through the booking service so the slot is freed on cancel
        // and re-claimed (or refused with 409) when un-cancelling.
        const updated = await setStatusByAdmin({ bookingId: req.params.id, status });
        const booking = await updated.populate('user', 'name email phone');

        // Tell the customer (confirmed / completed / cancelled; pending is silent).
        enqueueEmail('booking-status', { bookingId: String(booking._id), status: booking.status });

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
        if (error instanceof BookingError || error instanceof SlotUnavailableError) {
            return res.status(error.status).json({ success: false, error: error.message });
        }
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

// ─────────────────────────────────────────────
// GET /api/admin/email-queue — Email queue health (counts + latest failures)
// ─────────────────────────────────────────────
router.get('/email-queue', async (req, res) => {
    res.json({ success: true, queue: await getEmailQueueStats() });
});

// ─────────────────────────────────────────────
// POST /api/admin/email-queue/retry-failed — Re-run every failed email job
// ─────────────────────────────────────────────
router.post('/email-queue/retry-failed', async (req, res) => {
    try {
        const retried = await retryFailedEmails();
        res.json({ success: true, retried });
    } catch (error) {
        console.error('Retry failed emails error:', error.message);
        res.status(500).json({ success: false, error: 'Could not retry failed emails.' });
    }
});

module.exports = router;
