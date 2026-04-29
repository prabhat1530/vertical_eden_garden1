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
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
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
| **Service Browsing** | Explore 6+ professional gardening services with detailed descriptions, pricing & real images |
| **Online Booking** | 3-step booking wizard — select service → enter project details → review & pay |
| **Secure Payments** | Integrated Razorpay payment gateway (UPI, Cards, Net Banking, Wallets) |
| **Dual Login** | Login via **Email + Password** or **Phone + OTP** (SMS via Fast2SMS) |
| **My Bookings** | Track all past and current bookings with real-time status updates |
| **Reviews & Ratings** | Write star-rated reviews for completed bookings |
| **User Profile** | Update name, email, phone & change password |
| **Password Recovery** | Forgot password flow with email reset link |
| **AI Chatbot** | Built-in chatbot powered by **Google Gemini AI** for instant customer support |
| **WhatsApp Chat** | One-click WhatsApp button for direct business communication |

### 🔐 Admin Features
| Feature | Description |
|---|---|
| **Dashboard** | Overview of total users, bookings, revenue & recent activity |
| **Manage Bookings** | View all bookings, update status (Pending → Confirmed → Completed) |
| **Manage Users** | View all registered users with booking count, email, phone & role |
| **Role-Based Access** | Admin Panel is hidden from regular users — only visible to admin accounts |

### 🎨 Design & UX
| Feature | Description |
|---|---|
| **Fully Responsive** | Works perfectly on Desktop, Tablet & Mobile |
| **Modern UI** | Glassmorphism, smooth animations, gradient accents & premium feel |
| **Dark Header** | Sleek navigation with scroll effects & mobile hamburger menu |
| **Image Gallery** | Portfolio page showcasing real completed projects |
| **Blog Section** | Informational articles about gardening tips & trends |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** (TypeScript) | UI framework with type safety |
| **React Router v5** | Client-side routing & navigation |
| **Context API** | Global state management (Auth, User) |
| **CSS3** | Custom styling with CSS variables, flexbox & grid |
| **React Icons** | Beautiful icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** + **Express.js** | REST API server |
| **MongoDB Atlas** + **Mongoose** | Cloud database with ODM |
| **JWT** (JSON Web Tokens) | Secure authentication |
| **bcryptjs** | Password hashing |
| **express-validator** | Input validation & sanitization |

### Third-Party Integrations
| Service | Purpose |
|---|---|
| **Razorpay** | Payment processing |
| **Fast2SMS** | OTP delivery via SMS |
| **Google Gemini AI** | AI-powered chatbot |
| **Nodemailer** (Gmail SMTP) | Email notifications |
| **Firebase Admin** | Additional auth support |

### Deployment
| Platform | Purpose |
|---|---|
| **Vercel** | Frontend hosting (auto-deploys from GitHub) |
| **Render** | Backend API hosting (auto-deploys from GitHub) |
| **MongoDB Atlas** | Cloud database (Free M0 tier) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ installed ([Download](https://nodejs.org))
- **MongoDB Atlas** account ([Sign up free](https://cloud.mongodb.com))
- **Git** installed

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/prabhat1530/vertical_eden_garden1.git
cd vertical_eden_garden1
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Razorpay (Get keys from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL
CLIENT_URL=http://localhost:3000

# Fast2SMS (Get key from https://www.fast2sms.com)
FAST2SMS_API_KEY=your_fast2sms_api_key

# Google Gemini AI (Get key from https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key

# Email (Gmail App Password from https://myaccount.google.com/apppasswords)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
```

Start the backend server:

```bash
npm start
```

The API will be running at `http://localhost:5001`

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
REACT_APP_API_URL=/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Start the frontend:

```bash
npm start
```

The app will open at `http://localhost:3000`

### 4️⃣ Make Yourself Admin

```bash
cd backend
node makeAdmin.js
```

This script upgrades a specific user account to `admin` role. Edit the script to change the target email/phone.

---

## 📁 Project Structure

```
vertical_eden/
├── frontend/                    # React Frontend (TypeScript)
│   ├── public/                  # Static HTML & assets
│   └── src/
│       ├── components/          # Reusable UI Components
│       │   ├── Header.tsx       #   → Navigation bar with user menu
│       │   ├── Footer.tsx       #   → Site footer with links
│       │   ├── Hero.tsx         #   → Landing page hero section
│       │   ├── ChatBot/         #   → AI Chatbot (Gemini-powered)
│       │   ├── Reviews/         #   → Star rating & review components
│       │   ├── WhatsAppButton/  #   → Floating WhatsApp widget
│       │   └── ...
│       ├── pages/               # Application Pages
│       │   ├── Home.tsx         #   → Landing page
│       │   ├── Services.tsx     #   → All services listing
│       │   ├── ServiceDetail.tsx#   → Individual service details
│       │   ├── Booking.tsx      #   → 3-step booking wizard
│       │   ├── MyBookings.tsx   #   → User's booking history
│       │   ├── Login.tsx        #   → Email + OTP dual login
│       │   ├── Signup.tsx       #   → New user registration
│       │   ├── Profile.tsx      #   → User profile management
│       │   ├── Portfolio.tsx    #   → Project gallery
│       │   ├── Blog.tsx         #   → Blog articles
│       │   ├── Contact.tsx      #   → Contact form
│       │   ├── ForgotPassword.tsx #  → Password reset request
│       │   ├── ResetPassword.tsx  #  → Password reset form
│       │   └── Admin/           #   → Admin Dashboard
│       │       ├── AdminDashboard.tsx  # Stats & overview
│       │       ├── AdminBookings.tsx   # Manage all bookings
│       │       └── AdminUsers.tsx     # Manage all users
│       ├── context/
│       │   └── AuthContext.tsx   # Global auth state (login, logout, role)
│       ├── services/
│       │   └── PaymentService.ts # Razorpay payment integration
│       ├── data/
│       │   └── services.json    # Service catalog data
│       └── App.tsx              # Root component with routing
│
├── backend/                     # Node.js + Express API
│   ├── config/
│   │   └── db.js                # MongoDB connection setup
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── admin.js             # Admin role authorization
│   ├── models/                  # Mongoose Schemas
│   │   ├── User.js              #   → name, email, phone, password, role, otp
│   │   ├── Booking.js           #   → service, address, price, status, user
│   │   ├── Payment.js           #   → razorpay order/payment IDs, amount
│   │   └── Review.js            #   → rating, comment, user, booking
│   ├── routes/                  # API Endpoints
│   │   ├── auth.js              #   → signup, login, OTP, profile, password reset
│   │   ├── bookings.js          #   → create & manage bookings
│   │   ├── payments.js          #   → Razorpay order creation & verification
│   │   ├── reviews.js           #   → create & fetch reviews
│   │   ├── admin.js             #   → dashboard stats, manage users/bookings
│   │   └── chat.js              #   → Gemini AI chatbot endpoint
│   ├── utils/
│   │   └── sendEmail.js         # Nodemailer email utility
│   ├── server.js                # Express app entry point
│   └── .env                     # Environment variables (not in git)
│
└── README.md                    # This file
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/signup` | Register new user | ❌ |
| `POST` | `/login` | Email + password login | ❌ |
| `POST` | `/send-otp` | Send OTP to phone | ❌ |
| `POST` | `/verify-otp` | Verify OTP & login | ❌ |
| `GET` | `/me` | Get current user profile | ✅ |
| `PUT` | `/profile` | Update user profile | ✅ |
| `PUT` | `/change-password` | Change password | ✅ |
| `POST` | `/forgot-password` | Send password reset email | ❌ |
| `PUT` | `/reset-password/:token` | Reset password with token | ❌ |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Create a new booking | ✅ |
| `GET` | `/my` | Get current user's bookings | ✅ |

### Payments (`/api/payments`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/create-order` | Create Razorpay order | ✅ |
| `POST` | `/verify` | Verify payment signature | ✅ |

### Reviews (`/api/reviews`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Submit a review | ✅ |
| `GET` | `/service/:slug` | Get reviews for a service | ❌ |

### Admin (`/api/admin`) — 🔒 Admin Only
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/stats` | Dashboard statistics | 🔒 Admin |
| `GET` | `/bookings` | All bookings | 🔒 Admin |
| `PUT` | `/bookings/:id/status` | Update booking status | 🔒 Admin |
| `GET` | `/users` | All users | 🔒 Admin |

### AI Chat (`/api/chat`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Send message to AI chatbot | ❌ |

---

## 🔐 Security Features

- **Password Hashing** — All passwords are encrypted with bcryptjs (salt rounds: 10)
- **JWT Authentication** — Stateless token-based auth with 30-day expiry
- **Role-Based Access Control** — Admin routes are protected by `adminOnly` middleware
- **Input Validation** — All API inputs are validated using express-validator
- **Secure Payment** — Razorpay signature verification prevents payment tampering
- **OTP Expiry** — OTPs expire after 10 minutes
- **Reset Token Hashing** — Password reset tokens are SHA-256 hashed before storage

---

## 🌐 Deployment Guide

### Frontend → Vercel
1. Push code to GitHub
2. Import repository on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   - `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`
   - `REACT_APP_RAZORPAY_KEY_ID` = your Razorpay Key ID

### Backend → Render
1. Create a new **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `node server.js`
5. Add all environment variables from the `.env` template above

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
