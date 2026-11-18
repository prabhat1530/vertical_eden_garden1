<p align="center">
  <img src="frontend/src/images/images/logo-leaf.webp" alt="Vertical Eden Garden Logo" width="80" />
</p>

<h1 align="center">🌿 Vertical Eden Garden</h1>

<p align="center">
  <strong>A Full-Stack MERN Web Application for Premium Vertical Gardening Services</strong>
</p>

<p align="center">
  <a href="https://verticaledengarden.in">🌐 Live Website</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-tech-stack">🛠 Tech Stack</a> •
  <a href="#-getting-started">🚀 Getting Started</a> •
  <a href="#-project-structure">📁 Project Structure</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-17.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-Payment-0C2451?style=for-the-badge&logo=razorpay&logoColor=white" />
</p>

---

## 📖 About The Project

**Vertical Eden Garden** is a production-ready, full-stack web application for a vertical gardening business based in India. Customers can browse services, book appointments, make secure online payments, and leave reviews — all from a beautifully designed, mobile-responsive interface.

The platform also includes a complete **Admin Dashboard** for business owners to manage bookings, track revenue, and oversee all registered users.

---

## ✨ Features

### 🛒 Customer Features
| Feature | Description |
|---|---|
| **Service Browsing** | Explore 6 professional gardening services with descriptions, pricing & real images |
| **Slot Booking** | 3-step booking wizard with **live slot availability** — a date + time window can only be booked once |
| **Payment Hold** | An unpaid booking holds its slot for 15 minutes; it is released automatically if payment isn't completed |
| **Cancel & Reschedule** | From My Bookings: unpaid bookings any time, paid bookings until 24 hours before the visit (max 2 reschedules) |
| **Secure Payments** | Razorpay (UPI, Cards, Net Banking, Wallets), confirmed by the browser **and** by a signed Razorpay webhook, so closing the tab after paying is safe |
| **Dual Login** | Email + Password, or Phone + OTP (SMS via Fast2SMS) |
| **Stay Logged In Safely** | 15-minute access token + 7-day refresh token in an httpOnly cookie |
| **Emails** | Booking received, payment receipt **with PDF invoice attached**, confirmed / completed / cancelled, rescheduled, password reset — retried automatically if sending fails |
| **Invoice Download** | Download a PDF invoice for completed bookings |
| **Reviews & Ratings** | Star-rated reviews for completed bookings |
| **User Profile** | Update name, email, phone & change password |
| **Password Recovery** | Forgot-password email with a 30-minute reset link |
| **AI Chatbot** | Built-in support chatbot powered by **Google Gemini** |
| **WhatsApp Chat** | One-click WhatsApp button |

### 🔐 Admin Features
| Feature | Description |
|---|---|
| **Dashboard** | Users, bookings, revenue & recent activity (cached in Redis, refreshed on every booking change) |
| **Email Delivery Panel** | Sent / sending / waiting-to-retry / failed emails, failure reasons, and a "Retry failed emails" button |
| **Manage Bookings** | View all bookings and change status; cancelling frees the slot and the customer is emailed |
| **Manage Users** | All users with booking count, email, phone & role |
| **Role-Based Access** | Admin routes are protected on the server by the `adminOnly` middleware |

### 🎨 Design & UX
| Feature | Description |
|---|---|
| **Fully Responsive** | Desktop, tablet & mobile |
| **Loading Skeletons** | Shimmering skeleton loaders |
| **Image Gallery** | Portfolio of real completed projects |
| **Blog Section** | Gardening tips & trends |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 17** (TypeScript) | UI framework |
| **React Router v5** | Client-side routing |
| **Context API** | Auth state (access token, silent refresh) |
| **CSS3** | Custom styling |
| **jspdf** | In-browser PDF invoices |
| **React Icons** | Icons |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** + **Express 4** | REST API |
| **MongoDB Atlas** + **Mongoose 8** | Database (replica set → multi-document transactions for slot booking) |
| **Redis** + **ioredis** | Rate-limit counters, response cache, job queue storage |
| **BullMQ** | Email job queue with retries and backoff |
| **PDFKit** | Server-side PDF invoices |
| **JWT** + **bcryptjs** | Access tokens; password & OTP hashing |
| **helmet**, **express-rate-limit** | Security headers, rate limiting |
| **express-validator** | Input validation |
| **Swagger UI** (OpenAPI 3) | Interactive API documentation at `/api/docs` |
| **Jest**, **Supertest**, **mongodb-memory-server** | Automated tests against a real in-memory replica set |

### Third-Party Integrations
| Service | Purpose |
|---|---|
| **Razorpay** | Payments (orders, signature verification, webhook) |
| **Fast2SMS** | OTP delivery via SMS |
| **Google Gemini AI** | Chatbot |
| **Nodemailer** (Gmail SMTP) | Emails |

### Deployment
| Platform | Purpose |
|---|---|
| **Vercel** | Frontend (auto-deploys `main`; preview builds for other branches) |
| **Render** | Backend API (auto-deploys `main`) + **Key Value** (Redis) |
| **MongoDB Atlas** | Database |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **Redis** (optional locally — without it, emails aren't retried and nothing is cached). macOS: `brew install redis && brew services start redis`
- **Git**

A MongoDB Atlas account is **not** required for local development: `npm run db` starts a local MongoDB replica set.

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/prabhat1530/vertical_eden_garden1.git
cd vertical_eden_garden1
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values (see comments in the file)
```

For local development set `MONGO_URI=mongodb://127.0.0.1:27017/veg_dev?replicaSet=rs0`. Payment, SMS, AI and email keys are optional: without them those features run in **simulation mode** (OTP codes and emails are printed in the server log).

Start the database and the API in two terminals:

```bash
npm run db      # local MongoDB replica set on port 27017 (data kept in backend/.mongo-data)
npm start       # API on http://localhost:5001
```

- API docs: **http://localhost:5001/api/docs**
- Health check: http://localhost:5001/api/health

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
npm start       # http://localhost:3000 (proxies /api to port 5001)
```

### 4️⃣ Run the Tests

```bash
cd backend
npm test
```

44 tests (auth, slot booking races, payments & webhook, email queue, caching, API docs). Tests that need Redis use database 15 and are skipped if Redis isn't running.

### 5️⃣ Make Yourself Admin

```bash
cd backend
node makeAdmin.js
```

Edit the script to set the target email/phone.

### 🧰 Dev Tools

| Command (in `backend/`) | Purpose |
|---|---|
| `node scripts/simulate-webhook.js <bookingId>` | Pretend to be Razorpay: send a signed `payment.captured` webhook (`--failed`, `--forged` also available) |
| `EMAIL_SIMULATE_FAILURES=2 npm start` | Make the first 2 attempts of every email fail, to watch retries |
| `node scripts/backfill-slots.js [--apply]` | One-time migration: create slot records for bookings made before slot booking (dry run without `--apply`) |

---

## 📁 Project Structure

```
vertical_eden_garden1/
├── frontend/                      # React (TypeScript)
│   └── src/
│       ├── components/            # Header, Footer, ChatBot, Reviews, SlotSelect, …
│       ├── pages/                 # Home, Services, Booking, MyBookings, Login, Profile, Admin/…
│       ├── context/AuthContext.tsx# Session: access token, silent refresh, logout
│       ├── services/
│       │   ├── api.ts             # apiFetch(): token + cookie, refresh-and-retry on 401
│       │   └── PaymentService.ts  # Razorpay checkout
│       └── data/services.json     # Service catalog
│
└── backend/                       # Node.js + Express
    ├── config/                    # db, redis, slots (booking rules)
    ├── middleware/                # auth (JWT), admin, rateLimiter
    ├── models/                    # User, Booking, Slot, Payment, Review, RefreshToken, WebhookEvent
    ├── routes/                    # auth, bookings, payments, webhooks, reviews, admin, chat
    ├── services/                  # bookingService (transactions), slotService
    ├── queues/emailQueue.js       # BullMQ queue + worker
    ├── emails/                    # templates + job processor
    ├── utils/                     # tokens, cache, invoicePdf, sendEmail
    ├── docs/openapi.js            # API description (served at /api/docs)
    ├── scripts/                   # start-db, backfill-slots, simulate-webhook
    ├── tests/                     # Jest test suites
    └── server.js                  # App entry point
```

---

## 🔌 API Endpoints

**Full, interactive documentation: `/api/docs`** (Swagger UI) — every endpoint with its inputs, responses and error codes, and a "Try it out" button. A test fails if a route is added without being documented.

| Area | Endpoints |
|---|---|
| **Auth** `/api/auth` | `POST /signup` · `POST /login` · `POST /send-otp` · `POST /verify-otp` · `POST /refresh` · `POST /logout` · `GET /me` · `PUT /profile` · `PUT /change-password` · `POST /forgot-password` · `PUT /reset-password/:token` |
| **Bookings** `/api/bookings` | `GET /slots?date=` · `POST /` · `GET /` · `GET /:id` · `PUT /:id/cancel` · `PUT /:id/reschedule` |
| **Payments** `/api/payments` | `POST /create-order` · `POST /verify` · `POST /webhook` (Razorpay → server) |
| **Reviews** `/api/reviews` | `POST /` · `GET /:serviceSlug` |
| **Chat** `/api/chat` | `POST /` |
| **Admin** `/api/admin` 🔒 | `GET /stats` · `GET /bookings` · `PUT /bookings/:id/status` · `GET /users` · `GET /email-queue` · `POST /email-queue/retry-failed` |
| **System** | `GET /api/health` · `GET /api/ip` |

---

## 🔐 Security Features

- **Password hashing** — bcrypt, cost 12
- **Short-lived access tokens** — JWT valid 15 minutes, sent as `Authorization: Bearer`
- **Refresh tokens** — random, 7 days, httpOnly cookie, stored only as a SHA-256 hash, **rotated** on every use and **revoked** on logout or password reset
- **OTP protection** — OTP stored as a bcrypt hash, expires in 10 minutes, 5 wrong codes lock it for 15 minutes
- **Rate limiting** — per IP: OTP 5, login/signup/reset 20, whole API 300 per 15 minutes (stored in Redis; in-memory fallback)
- **Security headers** — helmet (no clickjacking, no MIME sniffing, `X-Powered-By` hidden, Content-Security-Policy)
- **No double booking** — atomic slot claim inside MongoDB transactions
- **Payment integrity** — Razorpay signature checks; the booking is found from the server's own order record; webhook signed with HMAC-SHA256, idempotent, amount-checked
- **Role-based access** — admin routes protected by `adminOnly` middleware
- **Input validation** — express-validator; customer text HTML-escaped in emails
- **Reset tokens** — SHA-256 hashed, 30-minute expiry

---

## 🌐 Deployment Guide

### Frontend → Vercel
1. Import the repository on [vercel.com](https://vercel.com), **Root Directory** `frontend`
2. Environment variables: `REACT_APP_API_URL` = `https://<backend>.onrender.com/api`, `REACT_APP_RAZORPAY_KEY_ID`
3. Vercel builds with `CI=true`: ESLint warnings fail the build — check with `CI=true npm run build`

### Backend → Render
1. New **Web Service**, **Root Directory** `backend`, build `npm install`, start `node server.js`
2. Add every variable from `backend/.env.example`, plus for production:
   - `NODE_ENV=production`, `CLIENT_URL=https://verticaledengarden.in`
   - `TRUST_PROXY=3` (Cloudflare + Render load balancer; check with `GET /api/ip`)
   - `RAZORPAY_WEBHOOK_SECRET`
3. **Redis:** create a Render **Key Value** instance in the same region, eviction policy **`noeviction`**, and set `REDIS_URL` to its internal URL. Without it everything still works, but emails are not retried and nothing is cached.
4. **Razorpay webhook:** Dashboard → Settings → Webhooks → URL `https://<backend>/api/payments/webhook`, same secret, events `payment.captured`, `payment.failed`, `order.paid`.

---

## 👨‍💻 Author

**Prabhat Kumar Bharadwaj**

- 🌐 Website: [verticaledengarden.in](https://verticaledengarden.in)
- 📧 Email: pk15sk30@gmail.com
- 🐙 GitHub: [@prabhat1530](https://github.com/prabhat1530)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with 💚 by Prabhat Kumar | © 2026 Vertical Eden Garden
</p>
