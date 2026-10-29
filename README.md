<p align="center"><img src="client/public/aavasa-logo.svg" alt="AAVASA logo" width="360"></p>

# AAVASA — A Stay That Feels Like Home

AAVASA is a full-stack **MERN** (MongoDB, Express, React, Node.js) hotel booking and management platform, built as a Full Stack Development capstone project. The name comes from the Hindi/Sanskrit word *Aavaas* (a dwelling, a home). *Har safar mein, ghar jaisa sukoon.*

> **Demo project notice.** All properties, descriptions, ratings, sample reviews and photographs are illustrative samples (photos from Unsplash). They do not represent real partner hotels. Checkout runs in **demo mode**: no card details are requested and no money is processed.

---

## 1. Features

**Guests**
- Editorial home page: hero search, featured stays, popular destinations (computed from the database), brand story, newsletter form (demo).
- **Explore Stays** with backend-driven search, price range, property type, amenities, star category, sorting, pagination, filter drawer on mobile, skeleton/empty/error states. Filters live in the URL, so searches can be refreshed or shared.
- **Hotel details**: gallery with lightbox, rooms with per-night availability for the chosen dates, policies, map link, reviews (clearly labelled *sample* until real reviews exist), similar stays, booking panel with a live **server-calculated** price quote.
- Register, login, logout, profile editing, password change (httpOnly-cookie JWT sessions).
- **Booking flow**: dates → room → capacity + availability validated on the server → price breakdown → demo checkout → unique reference (`AAV-XXXXXXXX`) → confirmation page → **My Bookings** (Upcoming / Past / Cancelled) with confirmed cancellation.

**Administrators** (`/admin`, protected in the UI *and* on every API route)
- Overview with real figures: properties, bookings, users, status distribution, recorded booking value, recent bookings, 30-day booking trend (only drawn when ≥2 days of data exist).
- Property CRUD (images with alt text, amenities, policies, location, featured/active). Safe delete: a property with booking history is *deactivated*, not deleted.
- Room-type management: price, capacity, **inventory**, amenities, 14-day occupancy view. Inventory cannot be cut below rooms already booked.
- Booking management: search/filter, details, status changes through a fixed state machine, cancellation that releases rooms.
- User management: search, booking history, activate/deactivate, promote/demote (with guard rails).

**Brand and UX**: custom SVG logo (arch “A”, doorway, leaves, peach sun), ivory/sage/olive/forest/sand/peach palette, Playfair Display + DM Sans, scroll-reveal and hover motion that respects `prefers-reduced-motion`, keyboard-accessible dialogs, skip link, visible focus states, graceful image fallbacks.

## 2. Technology stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios, React Hook Form, React Hot Toast, Recharts, Lucide React |
| Backend | Node.js (≥18), Express 4, Mongoose 8, JWT (jsonwebtoken), bcryptjs, Zod validation, Helmet, CORS, express-rate-limit, cookie-parser, Morgan |
| Database | MongoDB (Atlas or local) |
| Tests / quality | Vitest + Supertest + mongodb-memory-server, ESLint |

## 3. Folder structure

```
AAVASA/
├── client/                      React + Vite app
│   ├── public/                  favicon.svg, aavasa-logo.svg
│   ├── src/
│   │   ├── components/          Logo, Navbar, Footer, HotelCard, SearchForm, FilterPanel, RoomCard,
│   │   │                        BookingSummary, Gallery, FormField, Skeletons, EmptyState, ErrorState,
│   │   │                        ConfirmDialog, ProtectedRoute, ...
│   │   ├── context/             AuthContext
│   │   ├── hooks/               useFetch, useReveal, useDocumentTitle
│   │   ├── layouts/             MainLayout, AdminLayout
│   │   ├── pages/               Home, Explore, HotelDetails, Checkout, BookingConfirmation, MyBookings,
│   │   │                        Profile, Login, Register, OurStory, Policy, NotFound
│   │   │   └── admin/           AdminOverview, AdminHotels, AdminHotelForm, AdminRooms, AdminBookings, AdminUsers
│   │   ├── services/api.js      Axios client + every API call
│   │   └── utils/               formatting + validation helpers, image fallback
│   ├── .env.example  vercel.json  tailwind.config.js  vite.config.js
├── server/
│   ├── config/                  env.js, db.js
│   ├── controllers/             auth, hotel, booking, admin
│   ├── middleware/              auth (protect/restrictTo), validate, rateLimiters, errorHandler
│   ├── models/                  User, Hotel, RoomType, RoomInventory, Booking, Review
│   ├── routes/                  authRoutes, hotelRoutes, bookingRoutes, adminRoutes
│   ├── services/                pricingService, availabilityService, bookingService, hotelService
│   ├── scripts/                 seed.js, seedData.js, seedLib.js, createAdmin.js
│   ├── tests/                   auth, hotels, bookings, admin, units
│   ├── utils/                   AppError, dates, validators, ...
│   ├── app.js  server.js  .env.example
├── render.yaml  package.json  README.md  .gitignore
```

## 4. Prerequisites
- **Node.js 18 or newer** (`node -v`) and npm.
- A MongoDB database: free **MongoDB Atlas** cluster *or* MongoDB installed locally.
- A terminal and a code editor (VS Code recommended).

## 5. Install dependencies
From the `AAVASA` folder:
```bash
cd server && npm install
cd ../client && npm install
```
(or `npm run install:all` from the root).

## 6. Environment variables
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
**server/.env**

| Variable | Meaning |
|---|---|
| `NODE_ENV` | `development` locally, `production` when deployed |
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (≥32 chars). Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Session length, default `7d` |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated, e.g. `http://localhost:5173` |
| `TAX_RATE`, `SERVICE_FEE_RATE` | Percentages used by the pricing service (12 and 3 by default) |

**client/.env**

| Variable | Meaning |
|---|---|
| `VITE_API_URL` | `/api` locally (Vite proxies to the server). In production use the full API URL, e.g. `https://aavasa-api.onrender.com/api` |
| `VITE_DEV_PROXY_TARGET` | Dev only: where `/api` is forwarded (default `http://localhost:5000`) |

Never commit `.env` files (they are in `.gitignore`).

## 7. MongoDB Atlas setup
1. Create a free account at mongodb.com/atlas and create a **free (M0) cluster**.
2. **Database Access** → add a database user with a password (avoid special characters, or URL-encode them).
3. **Network Access** → add your current IP. (For a hosted API on Render, also allow `0.0.0.0/0`, then rely on a strong DB password.)
4. **Connect → Drivers** → copy the connection string and put it in `server/.env`:
   `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aavasa?retryWrites=true&w=majority`

## 8. Local MongoDB alternative
Install MongoDB Community Edition, start the service, and keep the default in `server/.env`:
`MONGODB_URI=mongodb://127.0.0.1:27017/aavasa`

## 9. Seed the database
```bash
cd server
npm run seed          # idempotent: safe to run repeatedly, never duplicates
npm run seed:reset    # wipes properties, rooms, bookings, inventory and reviews (NOT users), then re-seeds
```
This creates **10 fictional properties with 26 room types** across Jaipur, Manali, Goa, Udaipur, Munnar, Rishikesh, Mumbai, Bhopal, Kovalam, Jodhpur). `seed:reset` refuses to run when `NODE_ENV=production`.

## 10. Create an administrator (development only)
There is deliberately **no public way** to become an admin. Register normally in the app, then promote that email, or create one directly:
```bash
cd server
ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" ADMIN_PASSWORD='StrongPass123' npm run create-admin
# or run `npm run create-admin` and answer the prompts (the password prompt is hidden)
```
If the email already exists, that account is promoted (its password is unchanged). Credentials are never stored in source code. Admins can also promote other users from **Admin → Guests**.

## 11. Run the app
Open two terminals.
```bash
# Terminal 1: API  → http://localhost:5000  (health check: /api/health)
cd server && npm run dev

# Terminal 2: website → http://localhost:5173
cd client && npm run dev
```
Production build of the client: `cd client && npm run build` (output in `client/dist`).

## 12. API summary
All routes are under `/api`. 🔒 = signed in, 🛡 = admin only.

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · 🔒`GET /auth/me` · 🔒`PATCH /auth/me` · 🔒`PATCH /auth/me/password` |
| Hotels | `GET /hotels` (search/filter/sort/paginate) · `GET /hotels/featured` · `GET /hotels/meta` · `GET /hotels/destinations` · `GET /hotels/:idOrSlug` · `GET /hotels/:idOrSlug/availability` · `GET /hotels/:idOrSlug/reviews` · 🔒`POST /hotels/:idOrSlug/reviews` |
| Bookings | 🔒`POST /bookings/quote` · 🔒`POST /bookings` · 🔒`GET /bookings?group=upcoming\|past\|cancelled\|all` · 🔒`GET /bookings/:id` · 🔒`PATCH /bookings/:id/cancel` |
| Admin | 🛡`GET /admin/stats` · 🛡`/admin/hotels` (GET, POST) · 🛡`/admin/hotels/:id` (GET, PATCH, DELETE) · 🛡`/admin/hotels/:hotelId/rooms` (GET, POST) · 🛡`/admin/rooms/:id` (PATCH, DELETE) · 🛡`GET /admin/bookings` · 🛡`GET /admin/bookings/:id` · 🛡`PATCH /admin/bookings/:id/status` · 🛡`GET /admin/users` · 🛡`GET /admin/users/:id` · 🛡`PATCH /admin/users/:id` |

Hotel search query parameters: `q, checkIn, checkOut, guests, rooms, minPrice, maxPrice, propertyType (comma list), amenities (comma list), stars, sort (recommended|price_asc|price_desc|rating_desc), page, limit`.

## 13. Testing
```bash
cd server
npm test
```
Tests use an **in-memory MongoDB** (`mongodb-memory-server`), so they never touch your real database. The first run downloads a MongoDB binary (needs internet access). They cover: registration/login/logout/profile/password, role escalation attempts, protected routes, hotel listing/filtering/sorting, availability, valid and invalid bookings (past/reversed dates, capacity), **simultaneous booking of the last room**, rollback of partially held nights, duplicate-submission protection, ownership (users cannot see or cancel others' bookings), cancellation + inventory release, unauthorised admin access (401/403), admin hotel/room create/update/delete, booking status rules, stats and user management guard rails.

Lint: `cd server && npm run lint` and `cd client && npm run lint`.

## 14. Troubleshooting
| Problem | Fix |
|---|---|
| `Missing required environment variables` | Create `server/.env` from `.env.example` |
| `MongooseServerSelectionError` | Wrong `MONGODB_URI`, Atlas IP not allow-listed, or local MongoDB not running |
| Login works but you are logged out on refresh | In dev use `VITE_API_URL=/api` so the cookie is same-origin; check `CLIENT_URL` matches the browser URL exactly |
| CORS error in production | `CLIENT_URL` on the API must equal the deployed frontend origin (no trailing slash needed) |
| Empty site / no hotels | Run `npm run seed` in `server` |
| `EADDRINUSE: 5000` | Change `PORT` in `server/.env` and `VITE_DEV_PROXY_TARGET` in `client/.env` |
| Images missing | They are remote Unsplash photos; a built-in fallback illustration is shown if one fails |
| Tests cannot start MongoDB | First run needs to download a binary; check your network/proxy |

## 15. Database relationships
```
User 1───* Booking *───1 Hotel 1───* RoomType 1───* RoomInventory (one row per room type per night)
                  └──────────────* ─┘ (Booking also references the RoomType)
Booking 1───0..1 Review *───1 Hotel
```
- `Hotel` holds descriptive data, policies, derived `startingPrice`/`maxGuests`, and `isActive` (deactivate instead of delete).
- `RoomType` = a category of room with `totalRooms` physical units, `pricePerNight`, `maxGuests`.
- `RoomInventory` = `{ roomType, date, booked }`, unique per night.
- `Booking` stores `hotelSnapshot`/`roomSnapshot` so history stays readable after edits or deactivation, plus the full server-computed `pricing` block.

## 16. Booking logic
1. **Dates** (`server/utils/dates.js`): `YYYY-MM-DD` calendar days in UTC; check-in not in the past (today allowed); check-out after check-in; max 30 nights; up to 365 days ahead.
2. **Capacity**: guests ≤ `maxGuests × rooms`, and at least one guest per room.
3. **Availability**: free rooms = `totalRooms − max(booked)` over every night of the stay.
4. **Price** (`pricingService`, the only place totals are computed): `subtotal = rate × nights × rooms`, GST 12 %, service fee 3 %. Client-sent totals/status are ignored (stripped by validation).
5. **No overbooking**: each night is reserved with an atomic conditional update — `findOneAndUpdate({roomType, date, booked ≤ total − rooms}, {$inc: {booked: rooms}})`. MongoDB applies single-document updates atomically, so two people racing for the last room can never both win, and no transaction/replica set is required. If any night fails, nights already held are rolled back and the API returns **409**.
6. **Duplicate submissions**: the checkout sends an `idempotencyKey`; a repeat returns the original booking (unique per user).
7. **States**: `pending`, `confirmed` (demo checkout confirms instantly), `completed` (set automatically after check-out), `cancelled`. Admin changes follow `pending→confirmed/cancelled`, `confirmed→completed/cancelled`.
8. **Cancellation**: allowed until check-in day; the status flip is atomic (`inventoryHeld`), so rooms are released exactly once. Whether it was inside the free-cancellation window is recorded.
9. **Payments**: `payment.mode = "demo"`. The schema and `bookingService` keep a clear seam (`provider`, `status`) for a real gateway later.

## 17. Deployment guide
**Database** – MongoDB Atlas (section 7). Allow the API host's outbound IPs (or `0.0.0.0/0`).

**Backend (Render)**
1. Push the project to GitHub. In Render choose *New → Web Service* (or use `render.yaml`), root directory `server`.
2. Build `npm install`, start `npm start`, health check `/api/health`.
3. Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (≥32 chars), `CLIENT_URL=https://<your-app>.vercel.app`.
4. Seed once from your computer against Atlas: set `MONGODB_URI` locally and run `npm run seed`. Create an admin with `npm run create-admin -- --allow-production`.

**Frontend (Vercel)**
1. Import the repo, set **Root Directory** to `client`, framework *Vite*.
2. Environment variable: `VITE_API_URL=https://<your-api>.onrender.com/api`.
3. `vercel.json` already rewrites all routes to `index.html` for React Router.

**Cookies in production.** The API sets an httpOnly cookie with `Secure` and `SameSite=None` so a Vercel frontend can use a Render API. Some browsers (notably Safari and strict-privacy modes) block cross-site cookies. If you hit that, make the API same-origin by adding a Vercel rewrite `{ "source": "/api/:path*", "destination": "https://<your-api>.onrender.com/api/:path*" }` **before** the catch-all rule in `client/vercel.json` and setting `VITE_API_URL=/api`.

Render's free tier sleeps when idle, so the first request after a pause can take ~30 s.

This repository has **not** been deployed or verified on any host.

## 18. Verification status (honest report)
The package was authored in a sandbox whose network policy blocked the npm registry, so **dependencies could not be installed there**. Consequently:

| Check | Result |
|---|---|
| Every server `.js` file passes `node --check` | ✅ Passed |
| Date/stay-validation logic executed directly (valid, past, reversed, zero-night, >30 nights, bad format, impossible date) | ✅ Passed |
| Seed data matches the schema enums (property types, amenities, room amenities) | ✅ Passed |
| Whole React client compiled and bundled with esbuild, all local imports (incl. lazy admin pages) resolve | ✅ Passed |
| Frontend API calls cross-checked against backend routes | ✅ Passed (manual review) |
| `npm install`, `npm run build` (Vite + Tailwind), `npm test` (Vitest), ESLint | ⚠️ **Not run — please run these first** |
| Server start-up against a real MongoDB, seeding, end-to-end browser checks, responsive-viewport testing | ⚠️ **Not run** |
| Remote Unsplash photo IDs | ⚠️ Not fetched; the fallback illustration covers any that fail |

Run these once on your machine and fix anything reported:
```bash
cd server && npm install && npm test && npm run lint
cd ../client && npm install && npm run build
```
No `package-lock.json` is included (it could not be generated); `npm install` creates it.

## 19. Security notes
bcrypt (cost 12) password hashing · httpOnly + Secure(SameSite) cookie JWT · role read from the database on every request (never from the client) · `role` is not accepted on registration · Zod validation on all inputs (unknown keys stripped) · regex-escaped search input · Helmet · strict CORS allow-list · rate limiting (auth, bookings, whole API) · uniform login error message · tokens invalidated after password change · no secrets in the repository.

## 20. Credits
Photographs: Unsplash (illustrative). Icons: Lucide. Fonts: Playfair Display, DM Sans (Google Fonts).
