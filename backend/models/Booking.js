const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceSlug: {
        type: String,
        required: [true, 'Service slug is required'],
        trim: true,
    },
    serviceName: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true,
    },
    areaSize: {
        type: Number,
        required: [true, 'Area size is required'],
        min: [1, 'Area must be at least 1 sq ft'],
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    preferredDate: {
        type: String,
        required: [true, 'Preferred date is required'],
    },
    preferredTime: {
        type: String,
        required: [true, 'Preferred time is required'],
    },
    specialInstructions: {
        type: String,
        default: '',
        trim: true,
    },
    basePrice: {
        type: Number,
        required: true,
    },
    areaPrice: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending',
    },
    razorpayOrderId: {
        type: String,
        default: null,
    },
    paymentId: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Index for efficient user booking queries
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
