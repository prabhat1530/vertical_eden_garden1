const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { signAccessToken } = require('../utils/tokens');
const { toISTDateString } = require('../config/slots');

// Month key ('2026-11') `back` months before the current India-time month.
const monthKey = (back) => {
    const [y, m] = toISTDateString(new Date()).split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 - back, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

describe('Admin dashboard charts', () => {
    let adminToken;
    let customer;

    beforeEach(async () => {
        const admin = await User.create({ name: 'Admin', email: 'charts-admin@example.com', phone: '9000088001', password: 'secret1', role: 'admin' });
        customer = await User.create({ name: 'Cust', email: 'charts-cust@example.com', phone: '9000088002', password: 'secret1' });
        adminToken = signAccessToken(admin);
    });

    // Inserted directly so each booking can be given its own createdAt.
    const insert = (serviceName, status, totalPrice, createdAt) => Booking.collection.insertOne({
        user: customer._id, serviceSlug: serviceName.toLowerCase().replace(/ /g, '-'), serviceName,
        areaSize: 10, address: 'x', city: 'y', preferredDate: '2030-01-01', preferredTime: '09:00 - 11:00 AM',
        basePrice: 1, areaPrice: 1, totalPrice, status, createdAt, updatedAt: createdAt,
    });

    test('monthly, by-service and by-status numbers', async () => {
        const startOfThisMonthIST = new Date(`${monthKey(0)}-01T00:30:00+05:30`); // still last month in UTC
        await insert('Terrace Garden', 'confirmed', 5000, startOfThisMonthIST);
        await insert('Terrace Garden', 'pending', 9999, new Date()); // unpaid: not revenue
        await insert('Artificial Grass', 'completed', 3000, new Date(`${monthKey(3)}-15T12:00:00+05:30`));
        await insert('Terrace Garden', 'cancelled', 7000, new Date(`${monthKey(8)}-15T12:00:00+05:30`)); // older than 6 months

        const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        const { monthly, byService, byStatus } = res.body.charts;

        expect(monthly.map((m) => m.month)).toEqual([5, 4, 3, 2, 1, 0].map(monthKey));
        expect(monthly[5]).toEqual({ month: monthKey(0), bookings: 2, revenue: 5000 });
        expect(monthly[2]).toEqual({ month: monthKey(3), bookings: 1, revenue: 3000 });
        expect(monthly.reduce((n, m) => n + m.bookings, 0)).toBe(3); // the 8-month-old one is outside

        expect(byService).toEqual([
            { service: 'Terrace Garden', count: 3 },
            { service: 'Artificial Grass', count: 1 },
        ]);
        expect(byStatus).toEqual([
            { status: 'pending', count: 1 },
            { status: 'confirmed', count: 1 },
            { status: 'completed', count: 1 },
            { status: 'cancelled', count: 1 },
        ]);
    });

    test('no bookings: six empty months, empty services, zero statuses', async () => {
        const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`);
        const { monthly, byService, byStatus } = res.body.charts;
        expect(monthly).toHaveLength(6);
        expect(monthly.every((m) => m.bookings === 0 && m.revenue === 0)).toBe(true);
        expect(byService).toEqual([]);
        expect(byStatus.every((s) => s.count === 0)).toBe(true);
    });
});
