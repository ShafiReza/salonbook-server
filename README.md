# SalonBook Server

REST API for **SalonBook**, a salon appointment booking platform. Built with Node.js, Express 5, TypeScript (ES modules), MongoDB/Mongoose, Better Auth and Stripe.

## Features
- Better Auth (email + password, Google OAuth) with role-based access (`admin`, `customer`) and `isBlocked`
- Express JWT middleware verifying Better Auth tokens against its JWKS, then loading role/blocked state from MongoDB
- Services CRUD with search, category filter, price sort, pagination
- Appointment booking with atomic double-booking protection (partial unique index) and price snapshot
- Stripe Checkout + signature-verified webhook, idempotent transactions
- ImgBB image upload proxy (API key stays on the server)
- Zod validation, centralized error handling, Helmet, CORS, rate limiting

## Tech stack
Node.js 20+, Express 5, TypeScript, MongoDB + Mongoose, Better Auth (jwt plugin), Stripe, jose, Zod, Multer.

## Architecture
```
src/
  config/       env, db, Better Auth, constants
  controllers/  thin HTTP handlers
  middleware/   auth (JWT + roles), errors, rate limits
  models/       users (Better Auth collection), services, appointments, transactions
  routes/       resource routers
  services/     business logic
  utils/ types/ validators/
  scripts/      seed-admin, seed-services
  app.ts  server.ts
```
**Auth flow:** Better Auth runs inside this server (`/api/auth/*`). The browser signs in (session cookie), asks Better Auth for a short-lived JWT (`/api/auth/token`) and sends it as `Authorization: Bearer`. `authenticate` verifies signature, issuer, audience and expiry with `jose` against `/api/auth/jwks`, then reloads the user from MongoDB, so role and blocked status always come from the database.

**Booking rule:** one active (pending/confirmed) appointment per date + time slot for the whole salon, enforced by a unique partial index. Cancelling frees the slot.

**Payments:** `POST /api/payments/checkout` validates ownership/status and uses the stored `servicePrice`. Only the verified webhook (`checkout.session.completed`) creates the transaction and sets `paymentStatus: paid`.

## Installation
```bash
npm install
cp .env.example .env     # fill in values, include the DB name in MONGODB_URI
npm run seed:admin       # creates/promotes the admin from ADMIN_* variables
npm run seed:services    # optional starter services
npm run dev
```
Production: `npm run build && npm start`.

Stripe webhook locally: `stripe listen --forward-to localhost:5000/api/payments/webhook` and put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

Google OAuth redirect URIs (Google Cloud Console):
- `http://localhost:3000/api/auth/callback/google`
- `https://<your-vercel-domain>/api/auth/callback/google`

## Environment variables
`PORT, NODE_ENV, SERVER_URL, CLIENT_URL, MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_CURRENCY, IMGBB_API_KEY, SALON_TIMEZONE, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD` (see `.env.example`).

## API overview
| Area | Endpoints |
|---|---|
| Auth | Better Auth under `/api/auth/*` |
| Services | `GET /api/services` (`search, category, sort, page, limit`), `GET /api/services/:id`, `GET /api/services/admin/list`, `POST`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id` (admin) |
| Appointments | `POST /api/appointments`, `GET /my`, `GET /availability?date=`, `GET /` (admin), `GET /:id`, `PATCH /:id/cancel`, `PATCH /:id/confirm` |
| Users | `GET /api/users/me`, `PATCH /profile`, `GET /` (admin), `GET /:id`, `PATCH /:id/block`, `PATCH /:id/unblock` |
| Transactions | `GET /api/transactions` (admin), `GET /my` |
| Payments | `POST /api/payments/checkout`, `GET /api/payments/session/:id`, `POST /api/payments/webhook` |
| Stats | `GET /api/stats/customer`, `GET /api/stats/admin` |
| Uploads | `POST /api/uploads/image` (field `image`, 5MB) |

## Deployment notes
Deploy to a Node host (Render, Railway, Fly). Set `BETTER_AUTH_URL`/`SERVER_URL` to the server's public https URL and `CLIENT_URL` to the Vercel URL. Use MongoDB Atlas and allow the host's IPs. Add the production webhook endpoint in Stripe.

## Links
- Live website: _add after deployment_
- Client repository: _add after creating the repo_
- Server repository: _add after creating the repo_

## Screenshots
_Add screenshots of the API running / Stripe webhook logs here._
