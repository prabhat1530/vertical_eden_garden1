const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// Refresh tokens
// We never store the raw refresh token — only its SHA-256 hash, so a database
// leak can't be used to mint access tokens. Each token can be rotated (a new
// one replaces it) and revoked (on logout). The TTL index makes MongoDB delete
// expired tokens automatically.
// ─────────────────────────────────────────────
const refreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
    replacedByHash: {
        type: String,
        default: null,
    },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
}, { timestamps: true });

// TTL index: auto-delete documents once expiresAt passes.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
