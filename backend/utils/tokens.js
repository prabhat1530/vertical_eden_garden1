const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

// ─────────────────────────────────────────────
// Token helpers
// Access token  = short-lived JWT (default 15m) sent in the Authorization header.
// Refresh token = long-lived random string (default 7d) kept in an httpOnly
//                 cookie and stored hashed in the DB, used to mint new access
//                 tokens without re-login.
// ─────────────────────────────────────────────

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);
const REFRESH_COOKIE = 'veg_refresh';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const signAccessToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role || 'user' },
        process.env.JWT_SECRET || 'secret123',
        { expiresIn: ACCESS_TTL }
    );

// Create a fresh refresh token, persist its hash, return the raw value.
const issueRefreshToken = async (user, req) => {
    const raw = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(raw),
        expiresAt,
        userAgent: req?.headers?.['user-agent'] || '',
        ip: req?.ip || '',
    });

    return { raw, expiresAt };
};

// Revoke the old token and issue a new one (rotation): a stolen-but-used token
// is detectable because the original is now marked revoked.
const rotateRefreshToken = async (oldDoc, user, req) => {
    const { raw, expiresAt } = await issueRefreshToken(user, req);
    oldDoc.revokedAt = new Date();
    oldDoc.replacedByHash = sha256(raw);
    await oldDoc.save();
    return { raw, expiresAt };
};

// Look up a usable (not revoked, not expired) token document by raw value.
const findValidRefreshToken = async (raw) => {
    if (!raw) return null;
    const doc = await RefreshToken.findOne({ tokenHash: sha256(raw) }).populate('user');
    if (!doc) return null;
    if (doc.revokedAt) return null;
    if (doc.expiresAt < new Date()) return null;
    return doc;
};

const cookieOptions = (expiresAt) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: expiresAt,
    path: '/api/auth',
});

// Attach the refresh cookie to a response.
const setRefreshCookie = (res, raw, expiresAt) => {
    res.cookie(REFRESH_COOKIE, raw, cookieOptions(expiresAt));
};

const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(new Date()), expires: undefined });
};

module.exports = {
    REFRESH_COOKIE,
    sha256,
    signAccessToken,
    issueRefreshToken,
    rotateRefreshToken,
    findValidRefreshToken,
    setRefreshCookie,
    clearRefreshCookie,
};
