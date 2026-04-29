const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
    },
    serviceSlug: {
        type: String,
        required: true,
        trim: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
        maxlength: 500,
    },
}, {
    timestamps: true,
});

// One review per booking
reviewSchema.index({ booking: 1 }, { unique: true });
// For querying reviews by service
reviewSchema.index({ serviceSlug: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
