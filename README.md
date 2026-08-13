# painting-backend

Production-ready backend for the Crystal Coat Painting & Renovation admin system: Node.js + Express + MongoDB (Mongoose) + JWT auth + Multer/Sharp media pipeline.

This service is the single source of truth for content consumed by:
- the public website (`crystal-cotting`, read-only public GET routes)
- the admin dashboard (`painting-admin-dashboard`, authenticated CRUD routes)

All field names and endpoint paths follow `API_CONTRACT.md` (repo root of the three-project workspace) exactly.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: paste your real MongoDB Atlas connection string into MONGODB_URI,
# and set a strong JWT_SECRET + your desired ADMIN_EMAIL / ADMIN_PASSWORD.
npm run dev
```

If MongoDB is not installed locally and an Atlas connection is not available,
run `npm run start:memory` instead. It starts the complete API with a temporary
database; its data is intentionally discarded when the process stops.

The server listens on `PORT` (default `5000`). On first boot:
- If the `admins` collection is empty, one admin is auto-seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (bcrypt hash, cost 12).
- Every singleton page (Homepage, About, Contact, Settings) is upserted with sensible starter content if it doesn't exist yet, so the public site is never blank before the admin edits anything.
- `Service`, `Portfolio`, `Testimonial`, and `FAQ` collections are seeded with a handful of starter documents **only if empty** (won't touch/duplicate existing data on subsequent boots).

## Scripts

- `npm run dev` - start with nodemon (auto-restart)
- `npm start` - start once (production)
- `npm run start:memory` - start locally with a temporary in-memory database
- `npm run smoke-test` - full end-to-end test: spins up an in-memory MongoDB (`mongodb-memory-server`), boots the app, logs in, creates a service, uploads an image, and checks dashboard stats. **Requires outbound internet on first run** so it can download a `mongod` binary (cached after that).
- `npm run verify:offline` - a lighter, network-free check of JWT/bcrypt/CSV/mailer/upload-pipeline logic that doesn't need any MongoDB connection at all (useful in sandboxed/CI environments that can't reach `fastdl.mongodb.org`).

## Environment variables (`.env`)

```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/painting_admin?retryWrites=true&w=majority
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@crystalcoat.example
ADMIN_PASSWORD=ChangeThisPassword123!
WEBSITE_ORIGIN=http://localhost:5174
ADMIN_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Optional (mailer, only needed to go live with real SMTP instead of the console-log JSON transport): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.

## Folder structure

```
src/
 ├── controllers/   route handler logic
 ├── routes/        express routers, one per resource + src/routes/index.js aggregator
 ├── middleware/     auth (JWT), rate limiters, upload (multer), validation, error handler
 ├── models/        Mongoose schemas
 ├── services/      image processing (sharp/file-type), media-usage scanner, CSV export, seeding
 ├── validators/    express-validator chains per resource
 ├── uploads/       gitignored; uploaded originals + uploads/thumb/ thumbnails, served at /uploads
 ├── config/        db connection, winston logger
 ├── helpers/       asyncHandler, ApiError, activity logger
 └── utils/         JWT/token helpers, mailer stub
server.js           entry point - loads env, connects DB, runs seeds, starts listener
```

## Auth model

Single hardcoded admin, no registration. JWT is issued on login and set as an **httpOnly cookie** (`token`) AND returned in the JSON response body, so the dashboard can use either mechanism. Requests are authenticated via the cookie or an `Authorization: Bearer <token>` header (checked in that order).

Forgot/reset password: `POST /api/admin/forgot-password` generates a random token, stores only its SHA-256 hash + a 15-minute expiry on the Admin document, and "sends" the reset link via `src/utils/mailer.js`. That mailer is built on nodemailer's JSON transport by default (no real SMTP required - the message, including the reset link, is logged to the console/log files). Drop in real SMTP credentials via `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` env vars later with zero code changes.

## Endpoints

### Auth (`/api/admin`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/login` | public | `{email,password}` → `{token, admin:{id,email}}`, rate-limited |
| POST | `/logout` | public | clears the cookie |
| POST | `/change-password` | required | `{currentPassword,newPassword}` |
| POST | `/forgot-password` | public | `{email}`, rate-limited, generic response (doesn't leak whether email exists) |
| POST | `/reset-password` | public | `{token,newPassword}` |
| GET | `/me` | required | current admin profile |

### Homepage / About / Contact / Settings (singletons)
| Method | Path | Auth |
|---|---|---|
| GET / PUT | `/api/homepage` | public / required |
| GET / PUT | `/api/about` | public / required |
| GET / PUT | `/api/contact` | public / required |
| GET / PUT | `/api/settings` | public / required |

`GET` always upserts+returns a doc even before any `PUT` (seeded with starter content on boot).

### Services (`/api/services`)
`GET /` (`?category=main|secondary&featured=true`), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PUT /reorder` (`{order:[id,...]}`) - all writes require auth.

### Portfolio (`/api/portfolio`)
`GET /` (`?featured=true&category=&limit=`), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` - writes require auth.

### Testimonials (`/api/testimonials`)
`GET /` (`?featured=true`), `POST /`, `PUT /:id`, `DELETE /:id` - writes require auth.

### FAQ (`/api/faq`)
`GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `PUT /reorder` - writes require auth.

### Contact messages (`/api/contact/messages`)
`POST /` (public lead-form submission), `GET /` (auth, `?search=&read=&page=`), `GET /export` (auth, CSV download), `PATCH /:id/read` (auth, toggles or sets `isRead`), `DELETE /:id` (auth).

### Media library (`/api/media`)
`POST /upload` (auth, multipart `file` or `files[]`), `GET /` (auth, `?search=&category=&page=`), `PUT /:id` (auth, rename/category), `PUT /:id/replace` (auth, swap file keep same Media doc/id), `DELETE /:id` (auth, removes DB doc + files from disk), `GET /:id/usage` (auth, scans other collections for references to this URL).

Upload pipeline: extension allowlist (`jpg,jpeg,png,webp,svg`) + **magic-byte verification via `file-type`** (never trusts client `Content-Type`), 20MB max, raster images compressed with `sharp` (~80 quality, auto-oriented) plus a 320px-wide thumbnail; SVGs are validated (must actually contain an `<svg>` root) and stored as-is (no raster processing).

### Dashboard (`/api/dashboard/stats`, auth)
Returns `{ totalImages, galleryCount, servicesCount, portfolioCount, testimonialsCount, contactMessagesCount, recentUpdates }`.
- `totalImages` = total Media library documents.
- `galleryCount` = total number of images across all portfolio galleries (sum of each project's `images[]` length) - distinct from `portfolioCount`, which is the number of portfolio projects.
- `recentUpdates` is backed by a small internal `ActivityLog` collection (not part of the public API contract) written to on every create/update/delete, so the feed is cheap to query instead of sorting several collections on every dashboard load.

## Security

`helmet`, explicit CORS allowlist (`WEBSITE_ORIGIN`, `ADMIN_ORIGIN`, `credentials:true`), tight `express-rate-limit` on `/api/admin/login` (10/15min) and `/api/admin/forgot-password` (5/hour), a looser global limiter (500/15min) elsewhere, `express-validator` on every write route (400 + clear per-field messages on bad input), centralized error handler (no stack traces leaked when `NODE_ENV=production`), request logging via `morgan` piped into `winston` with daily-rotating log files under `logs/` (gitignored), bcrypt-compatible password hashing at cost 12, JWT secret from env only, Multer allowlist + 20MB limit + magic-byte sniffing on every upload.

## Deviations from API_CONTRACT.md

None to the contract itself (all field names, endpoint paths, and response shapes match exactly). Two implementation-level notes:

1. **bcrypt → bcryptjs.** The spec listed `bcrypt` (native binary) in the stack. The native module requires compiling against prebuilt binaries downloaded at install time; this failed in the sandboxed build/verification environment (no outbound access to GitHub release assets). Swapped to `bcryptjs`, a pure-JS, API-identical drop-in (same `hash`/`compare` signature, same cost-factor semantics) that removes the native-compilation dependency entirely - safer for portability across hosting providers too. No calling code differs.
2. **`galleryCount`** in dashboard stats isn't explicitly defined in the contract beyond its name. Implemented as "total images across all portfolio galleries" (see Dashboard section above) since it's listed separately from `portfolioCount`; happy to adjust the definition if the dashboard team expects something else.

## Testing note

`npm run smoke-test` needs outbound internet on first run (to fetch a `mongod` binary for `mongodb-memory-server`). In network-restricted environments, use `npm run verify:offline` for a DB-independent check of the auth/token/CSV/mailer/upload logic instead.
