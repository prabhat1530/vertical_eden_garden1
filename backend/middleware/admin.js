/**
 * Middleware to restrict routes to admin users only.
 * Must be used AFTER the `protect` middleware.
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        success: false,
        error: 'Access denied — admin only.',
    });
};

module.exports = { adminOnly };
