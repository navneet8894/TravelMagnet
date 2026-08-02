# TravelMagnet

TravelMagnet is a hotel discovery and booking platform for India. Development is intentionally
split into production-oriented modules; this repository currently contains the original portal UI
and the completed architecture/identity foundation.

- Customer: browse, search, book, pay, wishlist, manage bookings.
- Vendor: manage own hotels/rooms and see business dashboard stats.
- Super Admin: approve vendors/hotels and monitor platform analytics/commission.

## Stack

- Current frontend: Next.js App Router, TypeScript, Tailwind CSS, Lucide React
- Target frontend: React, Vite, TypeScript, Tailwind, shadcn/ui and TanStack Query
- Current backend: Node.js/CommonJS, Express, MongoDB/Mongoose, JWT and Stripe SDK
- Target backend: TypeScript clean architecture (migration follows stabilized API contracts)

## Run the landing page

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Frontend structure

```text
frontend/
  app/                 # App Router layout, page and global styles
  components/common/   # Button, heading, theme and language controls
  components/home/     # Landing-page sections and cards
  components/layout/   # Header, mobile menu and footer
  data/                # Destination, heritage and hotel mock data
  types/               # Future-ready TypeScript models
  utils/               # Date helpers
```

## Module 1: Architecture and identity

Implemented:

- Architecture, delivery sequence and schema decisions in `docs/`
- Customer and hotel-owner registration with Zod request validation
- Owner accounts remain pending and receive no authenticated session before approval
- 15-minute access JWTs with role claims, issuer/audience verification and account status checks
- Rotating opaque refresh tokens in secure HttpOnly cookies
- Hashed refresh/reset tokens, token-family reuse detection and logout revocation
- bcrypt cost 12, auth rate limiting, Helmet and restricted credentialed CORS
- Dedicated room type/daily inventory foundations
- Invoice, notification, transaction and GST record models
- GeoJSON hotel location and critical database indexes

Next module: owner onboarding, Cloudinary document upload, email/phone verification and admin
approval/rejection workflow.

## Existing backend features

- JWT auth (`user`, `vendor`, `admin`) with RBAC middleware
- Register/login/forgot/reset password APIs
- Hotel CRUD with owner-level authorization
- Room inventory embedded per hotel
- Booking creation/cancel/history
- Stripe payment intent + payment success update
- Commission model and auto-calculation flow
- Vendor and Admin dashboard stats endpoints
- Vendor approval + hotel approval admin controls
- Wishlist APIs

## Frontend Features Implemented

- Premium responsive base UI
- Home, Hotel listing/search, Hotel detail pages
- Login/Register (customer + vendor)
- Role-aware dashboard (admin/vendor)
- Protected routes and token persistence

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /api/hotels`
- `GET /api/hotels/:id`
- `POST /api/hotels`
- `PUT /api/hotels/:id`
- `DELETE /api/hotels/:id`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `PUT /api/bookings/:id/cancel`
- `POST /api/payments/create-intent`
- `POST /api/payments/mark-paid`
- `GET /api/dashboard/vendor`
- `GET /api/dashboard/admin`
- `GET /api/admin/vendors/pending`
- `PUT /api/admin/vendors/:id/approve`
- `PUT /api/admin/hotels/:id/approve`
- `GET /api/users/wishlist`
- `POST /api/users/wishlist/:hotelId`
- `DELETE /api/users/wishlist/:hotelId`

## Setup Instructions

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 3) MongoDB

Use local MongoDB or Atlas and update `MONGO_URI` in backend `.env`.

## Production Hardening Checklist

- Apply Zod request validation to non-auth modules
- Add Redis-backed distributed rate limiting and login lockout
- Add image uploads via Multer + cloud storage (S3/Cloudinary)
- Add real email templates and queue (BullMQ)
- Add Stripe webhook verification endpoint
- Add tests (unit, integration, e2e)
- Add CI/CD and containerization

## Important status

The whole platform is not production-ready yet. In particular, payment status is still updated by
an early endpoint and must be replaced by a signature-verified Stripe webhook before real payments
are accepted. See [architecture](docs/ARCHITECTURE.md) for the remaining module sequence.
