const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');

// Initialize Express app
const app = express();

// Trust the first proxy (Render/Vercel) so req.ip and rate limiting use the
// real client IP from X-Forwarded-For, not the proxy's address.
app.set('trust proxy', 1);

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
