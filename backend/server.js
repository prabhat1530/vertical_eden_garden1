// Load environment variables FIRST — some modules read process.env when
// they are required (e.g. Redis config, token lifetimes).
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const webhookRoutes = require('./routes/webhooks');

// Initialize Express app
const app = express();

// How many proxies sit between the internet and this app. Express uses it
// to read the real client IP from X-Forwarded-For (rate limiting depends on
// it). Too low → every visitor looks like the proxy's IP and shares one
// rate-limit counter; too high → visitors can fake their IP. Render puts
// Cloudflare in front of its own load balancer, so the right value must be
// measured with GET /api/ip (see below) and set via TRUST_PROXY.
const TRUST_PROXY = process.env.TRUST_PROXY || '1';
app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

// Secure HTTP headers (clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS — allow React frontend to make requests (credentials for the refresh cookie)
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));

// Razorpay webhook — mounted BEFORE express.json() because its signature is
// checked against the raw request bytes, and before the API rate limiter
// so bursts of payment notifications are never rejected.
app.use('/api/payments/webhook', webhookRoutes);

// Parse JSON bodies and cookies
app.use(express.json());
app.use(cookieParser());

// Global rate limit — a safety net across the whole API
app.use('/api', apiLimiter);

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Vertical Eden Garden API is running',
        timestamp: new Date().toISOString(),
    });
});

// IP check — used to calibrate TRUST_PROXY. When it is correct, `ip` equals
// the caller's real public IP. Only echoes the caller's own request data.
app.get('/api/ip', (req, res) => {
    res.json({
        ip: req.ip,
        forwardedFor: req.headers['x-forwarded-for'] || null,
        trustProxy: app.get('trust proxy'),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Connect to MongoDB
    await connectDB();

    // Make sure the unique (date, time) slot index exists before taking
    // bookings, then release unpaid slot holds every minute.
    await require('./models/Slot').init();
    require('./services/bookingService').startHoldSweeper();

    // Email worker: sends queued emails and retries failures (needs Redis).
    const { startEmailWorker, closeEmailQueue } = require('./queues/emailQueue');
    startEmailWorker();

    // On redeploy/shutdown, let in-flight email jobs finish before exiting.
    const shutdown = async (signal) => {
        console.log(`${signal} received — closing email worker`);
        await closeEmailQueue().catch(() => {});
        process.exit(0);
    };
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));

    app.listen(PORT, () => {
        console.log(`\n🌿 Vertical Eden Garden API`);
        console.log(`   Server running on port ${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
};

// Only start the server when run directly (`node server.js`).
// When imported by tests, the app is used without listening/connecting here.
if (require.main === module) {
    startServer();
}

module.exports = app;
