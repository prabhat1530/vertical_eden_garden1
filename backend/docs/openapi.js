// ─────────────────────────────────────────────
// OpenAPI 3 description of the Vertical Eden Garden API.
// Served as JSON at /api/docs/openapi.json and as interactive Swagger UI at
// /api/docs. tests/docs.test.js fails if a route exists in the app but not
// here (or the other way round), so this file can't silently go stale.
// ─────────────────────────────────────────────

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ 'application/json': { schema } });
const body = (schema, required = true) => ({ required, content: json(schema) });
const ok = (description, schema) => ({ description, content: json(schema) });
const err = (description) => ({ description, content: json(ref('Error')) });

const AUTH = [{ bearerAuth: [] }];
const RATE_LIMITED = err('Too many requests from this IP (rate limit). Try again later.');
const UNAUTHORIZED = err('Missing, invalid or expired access token.');
const FORBIDDEN = err('Logged in, but not an admin.');

const id = (name, description) => ({ name, in: 'path', required: true, schema: { type: 'string' }, description });

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'Vertical Eden Garden API',
        version: '2.0.0',
        description: [
            'Backend for verticaledengarden.in: accounts, slot-based bookings, Razorpay payments, reviews, AI chat and the admin dashboard.',
            '',
            '**Authentication.** Log in (`/api/auth/login`, `/api/auth/verify-otp`) to get a 15-minute **access token**; send it as `Authorization: Bearer <token>`. ' +
            'The response also sets an httpOnly `veg_refresh` cookie (7 days) used by `/api/auth/refresh` to get a new access token. Click **Authorize** above and paste an access token to try protected routes.',
            '',
            '**Rate limits** (per IP, 15-minute window): OTP 5, login/signup/password reset 20, whole API 300. Over the limit → `429`.',
            '',
            '**Responses** use `{ "success": true, ... }` or `{ "success": false, "error": "message" }`.',
        ].join('\n'),
    },
    servers: [{ url: '/', description: 'This server' }],
    tags: [
        { name: 'Auth', description: 'Signup, login (password or OTP), tokens, profile, password reset' },
        { name: 'Bookings', description: 'Slot availability, booking, cancel, reschedule' },
        { name: 'Payments', description: 'Razorpay orders, browser verification and webhook' },
        { name: 'Reviews', description: 'Reviews for completed bookings' },
        { name: 'Chat', description: 'Gemini-powered support chatbot' },
        { name: 'Admin', description: 'Admin-only dashboard data and actions' },
        { name: 'System', description: 'Health and diagnostics' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: '15-minute access token from login / refresh.' },
            refreshCookie: { type: 'apiKey', in: 'cookie', name: 'veg_refresh', description: 'httpOnly refresh token cookie (sent automatically by the browser).' },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: { success: { type: 'boolean', example: false }, error: { type: 'string', example: 'Something went wrong.' } },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '6afd55dc4d2abd7c161241cb' },
                    name: { type: 'string', example: 'Asha Verma' },
                    email: { type: 'string', example: 'asha@example.com' },
                    phone: { type: 'string', example: '9876543210' },
                    role: { type: 'string', enum: ['user', 'admin'] },
                },
            },
            AuthResponse: {
                type: 'object',
                description: 'Also sets the `veg_refresh` httpOnly cookie.',
                properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', description: 'Access token (JWT), valid 15 minutes.' },
                    user: ref('User'),
                },
            },
            Message: {
                type: 'object',
                properties: { success: { type: 'boolean', example: true }, message: { type: 'string' } },
            },
            TimeSlot: {
                type: 'string',
                enum: ['09:00 - 11:00 AM', '11:00 - 01:00 PM', '01:00 - 03:00 PM', '03:00 - 05:00 PM', '05:00 - 07:00 PM'],
            },
            SlotAvailability: {
                type: 'object',
                properties: {
                    time: ref('TimeSlot'),
                    capacity: { type: 'integer', example: 1 },
                    booked: { type: 'integer', example: 0 },
                    available: { type: 'boolean', example: true },
                },
            },
            BookingInput: {
                type: 'object',
                required: ['serviceSlug', 'serviceName', 'areaSize', 'address', 'city', 'preferredDate', 'preferredTime'],
                properties: {
                    serviceSlug: {
                        type: 'string',
                        enum: ['artificial-grass', 'artificial-green-wall', 'terrace-garden', 'creepers-and-shrubs', 'natural-vertical-garden', 'plants-and-planters'],
                    },
                    serviceName: { type: 'string', example: 'Terrace Garden' },
                    areaSize: { type: 'integer', minimum: 1, example: 150, description: 'Square feet. Price is calculated on the server.' },
                    address: { type: 'string', example: '12 Rose Lane' },
                    city: { type: 'string', example: 'New Delhi' },
                    preferredDate: { type: 'string', format: 'date', example: '2027-01-15', description: 'From tomorrow up to 90 days ahead (India time).' },
                    preferredTime: ref('TimeSlot'),
                    specialInstructions: { type: 'string' },
                },
            },
            Booking: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    serviceSlug: { type: 'string' },
                    serviceName: { type: 'string' },
                    areaSize: { type: 'integer' },
                    address: { type: 'string' },
                    city: { type: 'string' },
                    preferredDate: { type: 'string', format: 'date' },
                    preferredTime: ref('TimeSlot'),
                    specialInstructions: { type: 'string' },
                    basePrice: { type: 'number', example: 5000 },
                    areaPrice: { type: 'number', example: 18000 },
                    totalPrice: { type: 'number', example: 23000 },
                    status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
                    paymentId: { type: 'string', nullable: true },
                    holdExpiresAt: { type: 'string', format: 'date-time', nullable: true, description: 'Unpaid bookings hold their slot until this time (15 minutes).' },
                    cancelledBy: { type: 'string', enum: ['user', 'admin', 'system'], nullable: true },
                    cancelReason: { type: 'string' },
                    refundStatus: { type: 'string', enum: ['none', 'pending', 'refunded'] },
                    rescheduleCount: { type: 'integer', description: 'At most 2.' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            BookingResponse: { type: 'object', properties: { success: { type: 'boolean', example: true }, booking: ref('Booking') } },
            Review: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    rating: { type: 'integer', minimum: 1, maximum: 5 },
                    comment: { type: 'string' },
                    userName: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            AdminBooking: {
                allOf: [ref('Booking'), {
                    type: 'object',
                    properties: { user: { type: 'object', nullable: true, properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } } } },
                }],
            },
        },
    },
    paths: {
        // ───────── Auth ─────────
        '/api/auth/signup': {
            post: {
                tags: ['Auth'], summary: 'Create an account with email + password',
                requestBody: body({
                    type: 'object', required: ['name', 'email', 'phone', 'password'],
                    properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, phone: { type: 'string' }, password: { type: 'string', minLength: 6 } },
                }),
                responses: { 201: ok('Account created and logged in', ref('AuthResponse')), 400: err('Invalid input or email already registered'), 429: RATE_LIMITED },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'], summary: 'Log in with email + password',
                requestBody: body({ type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } }),
                responses: { 200: ok('Logged in', ref('AuthResponse')), 400: err('Invalid input'), 401: err('Invalid credentials'), 429: RATE_LIMITED },
            },
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'], summary: 'Current user', security: AUTH,
                responses: { 200: ok('The logged-in user', { type: 'object', properties: { success: { type: 'boolean' }, user: ref('User') } }), 401: UNAUTHORIZED },
            },
        },
        '/api/auth/send-otp': {
            post: {
                tags: ['Auth'], summary: 'Send a login OTP by SMS',
                description: 'Generates a 6-digit OTP valid for 10 minutes, stores only its bcrypt hash, and sends it via Fast2SMS. Creates the account if the phone is new.',
                requestBody: body({ type: 'object', required: ['phone'], properties: { phone: { type: 'string', example: '9876543210' } } }),
                responses: { 200: ok('OTP sent', ref('Message')), 400: err('Phone missing'), 429: RATE_LIMITED },
            },
        },
        '/api/auth/verify-otp': {
            post: {
                tags: ['Auth'], summary: 'Log in with the OTP',
                description: 'After 5 wrong codes the phone is locked for 15 minutes.',
                requestBody: body({ type: 'object', required: ['phone', 'otp'], properties: { phone: { type: 'string' }, otp: { type: 'string', example: '123456' } } }),
                responses: {
                    200: ok('Logged in', ref('AuthResponse')),
                    400: err('Wrong code ("N attempt(s) left"), expired, or no OTP requested'),
                    429: err('Locked after 5 wrong codes, or rate limited'),
                },
            },
        },
        '/api/auth/refresh': {
            post: {
                tags: ['Auth'], summary: 'Get a new access token from the refresh cookie',
                description: 'Rotates the refresh token: the cookie is replaced and the old token is revoked, so replaying it fails.',
                security: [{ refreshCookie: [] }],
                responses: { 200: ok('New access token (and a new refresh cookie)', ref('AuthResponse')), 401: err('Missing, expired, revoked or already-used refresh token') },
            },
        },
        '/api/auth/logout': {
            post: {
                tags: ['Auth'], summary: 'Log out (revoke the refresh token)', security: [{ refreshCookie: [] }],
                responses: { 200: ok('Logged out; cookie cleared', ref('Message')) },
            },
        },
        '/api/auth/profile': {
            put: {
                tags: ['Auth'], summary: 'Update name, email or phone', security: AUTH,
                requestBody: body({ type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, phone: { type: 'string' } } }),
                responses: { 200: ok('Updated user', { type: 'object', properties: { success: { type: 'boolean' }, user: ref('User') } }), 401: UNAUTHORIZED },
            },
        },
        '/api/auth/change-password': {
            put: {
                tags: ['Auth'], summary: 'Change password', security: AUTH,
                requestBody: body({ type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } } }),
                responses: { 200: ok('Password changed', ref('Message')), 400: err('Wrong current password, too short, or OTP-only account'), 401: UNAUTHORIZED },
            },
        },
        '/api/auth/forgot-password': {
            post: {
                tags: ['Auth'], summary: 'Email a password reset link',
                description: 'Always returns the same message, so it does not reveal which emails are registered. The email is sent through the retrying email queue.',
                requestBody: body({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
                responses: { 200: ok('Reset link sent if the email is registered', ref('Message')), 400: err('Email missing'), 429: RATE_LIMITED },
            },
        },
        '/api/auth/reset-password/{token}': {
            put: {
                tags: ['Auth'], summary: 'Set a new password using the emailed link',
                description: 'Also logs the user out everywhere (all refresh tokens revoked).',
                parameters: [id('token', 'Token from the reset link (valid 30 minutes)')],
                requestBody: body({ type: 'object', required: ['password'], properties: { password: { type: 'string', minLength: 6 } } }),
                responses: { 200: ok('Password reset', ref('Message')), 400: err('Invalid or expired token, or password too short'), 429: RATE_LIMITED },
            },
        },

        // ───────── Bookings ─────────
        '/api/bookings/slots': {
            get: {
                tags: ['Bookings'], summary: 'Availability of the 5 time slots on a date',
                parameters: [{ name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2027-01-15' }],
                responses: {
                    200: ok('Slots for the date', { type: 'object', properties: { success: { type: 'boolean' }, date: { type: 'string' }, slots: { type: 'array', items: ref('SlotAvailability') } } }),
                    400: err('date must be YYYY-MM-DD'),
                },
            },
        },
        '/api/bookings': {
            post: {
                tags: ['Bookings'], summary: 'Book a slot (held 15 minutes for payment)', security: AUTH,
                description: 'Claims the slot atomically inside a MongoDB transaction: of several simultaneous requests for the same slot exactly one succeeds. The price is calculated on the server. Queues a "booking received" email.',
                requestBody: body(ref('BookingInput')),
                responses: { 201: ok('Booking created with status "pending"', ref('BookingResponse')), 400: err('Invalid input, service, date or time'), 401: UNAUTHORIZED, 409: err('Slot already booked') },
            },
            get: {
                tags: ['Bookings'], summary: "The current user's bookings", security: AUTH,
                responses: { 200: ok('Bookings, newest first', { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, bookings: { type: 'array', items: ref('Booking') } } }), 401: UNAUTHORIZED },
            },
        },
        '/api/bookings/{id}': {
            get: {
                tags: ['Bookings'], summary: 'One of the current user\'s bookings', security: AUTH,
                parameters: [id('id', 'Booking id')],
                responses: { 200: ok('The booking (includes razorpayOrderId)', ref('BookingResponse')), 401: UNAUTHORIZED, 404: err('Not found or not yours') },
            },
        },
        '/api/bookings/{id}/cancel': {
            put: {
                tags: ['Bookings'], summary: 'Cancel a booking and free its slot', security: AUTH,
                description: 'Unpaid bookings any time; paid bookings until 24 hours before the visit (a refund is flagged).',
                parameters: [id('id', 'Booking id')],
                requestBody: body({ type: 'object', properties: { reason: { type: 'string' } } }, false),
                responses: { 200: ok('Cancelled', ref('BookingResponse')), 400: err('Already cancelled, completed, or within 24 hours'), 401: UNAUTHORIZED, 404: err('Not found or not yours') },
            },
        },
        '/api/bookings/{id}/reschedule': {
            put: {
                tags: ['Bookings'], summary: 'Move a booking to another slot',
                description: 'Claims the new slot and releases the old one in one transaction; if the new slot is taken nothing changes. At most 2 reschedules; paid bookings until 24 hours before the visit.',
                security: AUTH,
                parameters: [id('id', 'Booking id')],
                requestBody: body({ type: 'object', required: ['preferredDate', 'preferredTime'], properties: { preferredDate: { type: 'string', format: 'date' }, preferredTime: ref('TimeSlot') } }),
                responses: { 200: ok('Rescheduled', ref('BookingResponse')), 400: err('Not allowed (status, 24-hour rule, limit, same slot, invalid date)'), 401: UNAUTHORIZED, 404: err('Not found or not yours'), 409: err('New slot already booked') },
            },
        },

        // ───────── Payments ─────────
        '/api/payments/create-order': {
            post: {
                tags: ['Payments'], summary: 'Create a Razorpay order for a pending booking', security: AUTH,
                requestBody: body({ type: 'object', required: ['bookingId'], properties: { bookingId: { type: 'string' } } }),
                responses: {
                    200: ok('Order for Razorpay Checkout', { type: 'object', properties: { success: { type: 'boolean' }, order: { type: 'object', properties: { id: { type: 'string' }, amount: { type: 'integer', description: 'Paise' }, currency: { type: 'string', example: 'INR' } } }, key: { type: 'string', description: 'Razorpay key id' } } }),
                    400: err('Booking already paid / bookingId missing'), 401: UNAUTHORIZED, 404: err('Booking not found'), 410: err('Slot hold expired; book again'),
                },
            },
        },
        '/api/payments/verify': {
            post: {
                tags: ['Payments'], summary: 'Confirm a payment from the browser (Razorpay Checkout handler)', security: AUTH,
                description: 'Checks the Razorpay signature, finds the booking from our own order record, and confirms it. Safe to call more than once; if the webhook already confirmed it, no second receipt is sent.',
                requestBody: body({ type: 'object', required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'], properties: { razorpay_order_id: { type: 'string' }, razorpay_payment_id: { type: 'string' }, razorpay_signature: { type: 'string' } } }),
                responses: {
                    200: ok('Payment verified, booking confirmed', { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, booking: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' }, paymentId: { type: 'string' } } } } }),
                    400: err('Incomplete data or signature mismatch'), 401: UNAUTHORIZED, 404: err('Order not found for this user'),
                    409: err('Paid after the 15-minute hold expired and the slot was taken; refund flagged'),
                },
            },
        },
        '/api/payments/webhook': {
            post: {
                tags: ['Payments'], summary: 'Razorpay webhook (server-to-server)',
                description: 'Called by Razorpay, not by browsers. Confirms bookings even if the customer closed the tab. Verifies the HMAC-SHA256 signature of the raw body with RAZORPAY_WEBHOOK_SECRET, skips repeated event ids, and checks the amount. Handles payment.captured, order.paid and payment.failed.',
                parameters: [
                    { name: 'X-Razorpay-Signature', in: 'header', required: true, schema: { type: 'string' } },
                    { name: 'X-Razorpay-Event-Id', in: 'header', required: false, schema: { type: 'string' } },
                ],
                requestBody: body({ type: 'object', example: { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123', order_id: 'order_123', amount: 2300000, status: 'captured' } } } } }),
                responses: {
                    200: ok('Handled (or duplicate)', { type: 'object', properties: { success: { type: 'boolean' }, duplicate: { type: 'boolean' } } }),
                    400: err('Invalid signature or JSON'), 500: err('Webhook secret not configured, or processing failed (Razorpay will retry)'),
                },
            },
        },

        // ───────── Reviews ─────────
        '/api/reviews': {
            post: {
                tags: ['Reviews'], summary: 'Review a completed booking (one review per booking)', security: AUTH,
                requestBody: body({ type: 'object', required: ['bookingId', 'rating', 'comment'], properties: { bookingId: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string', maxLength: 500 } } }),
                responses: { 201: ok('Review created', { type: 'object', properties: { success: { type: 'boolean' }, review: ref('Review') } }), 400: err('Invalid input, booking not completed, or already reviewed'), 401: UNAUTHORIZED, 404: err('Booking not found') },
            },
        },
        '/api/reviews/summary': {
            get: {
                tags: ['Reviews'], summary: 'Average rating and review count for every service',
                description: 'Used by the service cards. Computed with a MongoDB aggregation, cached in Redis for 10 minutes and cleared when a review is posted. Services with no reviews are left out.',
                responses: { 200: ok('Ratings keyed by service slug', { type: 'object', properties: { success: { type: 'boolean' }, services: { type: 'object', additionalProperties: { type: 'object', properties: { averageRating: { type: 'number', example: 4.5 }, count: { type: 'integer', example: 12 } } }, example: { 'terrace-garden': { averageRating: 4.5, count: 12 } } } } }) },
            },
        },
        '/api/reviews/{serviceSlug}': {
            get: {
                tags: ['Reviews'], summary: 'Reviews and average rating for a service',
                description: 'Cached in Redis for 10 minutes and cleared when a review is posted. The `X-Cache` header shows HIT, MISS or BYPASS (no Redis).',
                parameters: [id('serviceSlug', 'e.g. terrace-garden')],
                responses: { 200: ok('Reviews, newest first', { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, averageRating: { type: 'number', example: 4.5 }, reviews: { type: 'array', items: ref('Review') } } }) },
            },
        },

        // ───────── Chat ─────────
        '/api/chat': {
            post: {
                tags: ['Chat'], summary: 'Ask the gardening support chatbot (Google Gemini)',
                requestBody: body({
                    type: 'object', required: ['message'],
                    properties: {
                        message: { type: 'string', example: 'How often should I water a vertical garden?' },
                        history: { type: 'array', items: { type: 'object', properties: { role: { type: 'string', enum: ['user', 'model'] }, text: { type: 'string' } } } },
                    },
                }),
                responses: { 200: ok('Chatbot reply', { type: 'object', properties: { success: { type: 'boolean' }, reply: { type: 'string' } } }), 400: err('Message missing'), 500: err('Gemini not configured or unavailable') },
            },
        },

        // ───────── Admin ─────────
        '/api/admin/stats': {
            get: {
                tags: ['Admin'], summary: 'Dashboard numbers, chart data and the 5 latest bookings', security: AUTH,
                description: 'Cached in Redis for 60 seconds and cleared after any booking change. See the `X-Cache` header.',
                responses: {
                    200: ok('Stats', {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            stats: { type: 'object', properties: { totalUsers: { type: 'integer' }, totalBookings: { type: 'integer' }, pendingBookings: { type: 'integer' }, confirmedBookings: { type: 'integer' }, completedBookings: { type: 'integer' }, totalRevenue: { type: 'number' } } },
                            recentBookings: { type: 'array', items: ref('AdminBooking') },
                            charts: {
                                type: 'object',
                                description: 'Computed with MongoDB aggregations. Months are in India time (booking date); revenue counts paid bookings only.',
                                properties: {
                                    monthly: { type: 'array', description: 'Last 6 months, oldest first, zeros included', items: { type: 'object', properties: { month: { type: 'string', example: '2026-11' }, bookings: { type: 'integer' }, revenue: { type: 'number' } } } },
                                    byService: { type: 'array', description: 'Most booked first', items: { type: 'object', properties: { service: { type: 'string', example: 'Terrace Garden' }, count: { type: 'integer' } } } },
                                    byStatus: { type: 'array', items: { type: 'object', properties: { status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] }, count: { type: 'integer' } } } },
                                },
                            },
                        },
                    }),
                    401: UNAUTHORIZED, 403: FORBIDDEN,
                },
            },
        },
        '/api/admin/bookings': {
            get: {
                tags: ['Admin'], summary: 'All bookings', security: AUTH,
                responses: { 200: ok('All bookings, newest first', { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, bookings: { type: 'array', items: ref('AdminBooking') } } }), 401: UNAUTHORIZED, 403: FORBIDDEN },
            },
        },
        '/api/admin/bookings/{id}/status': {
            put: {
                tags: ['Admin'], summary: 'Change a booking\'s status',
                description: 'Cancelling frees the slot; re-activating a cancelled booking re-claims it (409 if taken). Emails the customer on confirmed / completed / cancelled.',
                security: AUTH,
                parameters: [id('id', 'Booking id')],
                requestBody: body({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] } } }),
                responses: { 200: ok('Updated', { type: 'object', properties: { success: { type: 'boolean' }, booking: ref('AdminBooking') } }), 400: err('Invalid status'), 401: UNAUTHORIZED, 403: FORBIDDEN, 404: err('Booking not found'), 409: err('Slot taken (when re-activating)') },
            },
        },
        '/api/admin/users': {
            get: {
                tags: ['Admin'], summary: 'All users with their booking counts', security: AUTH,
                responses: {
                    200: ok('Users', { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, users: { type: 'array', items: { allOf: [ref('User'), { type: 'object', properties: { bookingCount: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' } } }] } } } }),
                    401: UNAUTHORIZED, 403: FORBIDDEN,
                },
            },
        },
        '/api/admin/email-queue': {
            get: {
                tags: ['Admin'], summary: 'Email queue health', security: AUTH,
                description: '`enabled: false` means no Redis is configured: emails are sent once without retries.',
                responses: {
                    200: ok('Queue counts and the 10 latest failures', {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            queue: {
                                type: 'object',
                                properties: {
                                    enabled: { type: 'boolean' },
                                    error: { type: 'string' },
                                    counts: { type: 'object', properties: { waiting: { type: 'integer' }, active: { type: 'integer' }, delayed: { type: 'integer' }, completed: { type: 'integer' }, failed: { type: 'integer' } } },
                                    recentFailed: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, type: { type: 'string' }, reason: { type: 'string' }, attempts: { type: 'integer' }, failedAt: { type: 'string', format: 'date-time' } } } },
                                },
                            },
                        },
                    }),
                    401: UNAUTHORIZED, 403: FORBIDDEN,
                },
            },
        },
        '/api/admin/email-queue/retry-failed': {
            post: {
                tags: ['Admin'], summary: 'Retry every failed email', security: AUTH,
                responses: { 200: ok('Number of jobs put back in the queue', { type: 'object', properties: { success: { type: 'boolean' }, retried: { type: 'integer' } } }), 401: UNAUTHORIZED, 403: FORBIDDEN },
            },
        },

        // ───────── System ─────────
        '/api/health': {
            get: {
                tags: ['System'], summary: 'Health check',
                responses: { 200: ok('API is running', { type: 'object', properties: { status: { type: 'string', example: 'ok' }, message: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' } } }) },
            },
        },
        '/api/ip': {
            get: {
                tags: ['System'], summary: 'The client IP as the server sees it',
                description: 'Used to calibrate TRUST_PROXY: correct when `ip` equals your real public IP.',
                responses: { 200: ok('IP information', { type: 'object', properties: { ip: { type: 'string' }, forwardedFor: { type: 'string', nullable: true }, trustProxy: {} } }) },
            },
        },
    },
};
