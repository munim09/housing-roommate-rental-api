# Housing & Roommate Backend

Backend API for a housing & roommate matching platform. Owners and managers list flats/rooms, tenants apply for stays, invoices are generated for rent & utility bills, and payments are collected via SSLCommerz.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js (Express 5) |
| Language | TypeScript (ESM) |
| Database | PostgreSQL |
| ORM | Prisma 7 (`prisma-client` generator → `generated/prisma`) |
| Payments | SSLCommerz |
| Auth | JWT (access + refresh), Google OAuth, OTP via email |
| Cache / OTP store | Redis |
| Email | Nodemailer + EJS templates |
| Images | Cloudinary (via Multer) |
| Build | tsup |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis
- SSLCommerz sandbox credentials (for payments)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default `5000`) |
| `APP_URL` | Frontend URL (CORS origin) |
| `FRONT_END_URL` | Frontend app URL |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (e.g. `50m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. `7d`) |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds |
| `SSL_STORE_ID` | SSLCommerz store ID |
| `SSL_STORE_PASSWD` | SSLCommerz store password |
| `REDIS_USER` / `REDIS_PASSWORD` / `REDIS_HOST` / `REDIS_PORT` | Redis connection |
| `SMTP_USER` / `SMTP_PASSWORD` / `EMAIL_SENDER` | SMTP credentials |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

### Commands

```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # Build to dist/ (tsup)
npm start            # Start compiled server
npm run seed         # Run seed script
npx prisma migrate dev --name <name>   # Create & run a migration
npx prisma generate  # Regenerate the Prisma client after schema changes
```

> Note: The Prisma client is generated to `generated/prisma/`. After any schema change you must run `npx prisma generate` — migrations alone do not update the client. There are no lint, typecheck, or test scripts configured.

## Architecture

### Folder Structure

```
├── prisma/
│   ├── schema/                 # Split Prisma schema (one file per model + enums)
│   └── seed.ts                 # Seed script (uses hardcoded providerId/categoryId)
├── src/
│   ├── app.ts                  # Express app: middleware + route mounting
│   ├── server.ts               # Entry point: connects Prisma, starts server
│   ├── config/                 # Typed config loaded from .env via dotenv
│   ├── lib/                    # Clients: prisma, redis, multer, cloudinary, nodemailer, googleAuth, cronJob
│   ├── middlewares/            # checkAuth (JWT), validateRequest (Zod), upload, error handlers
│   ├── module/                 # Feature modules (route + controller + service + validation + interface)
│   │   ├── auth/               # Register, login, verify, tokens, password reset
│   │   ├── admin/              # User management, cities, areas
│   │   ├── owner/              # Properties, flats, rooms, manager assignment, images
│   │   ├── manager/            # Applications, manager's advertisements
│   │   ├── advertisement/      # Advertisements + utility invoices
│   │   ├── tenant/             # Viewing requests, applications, invoices, stays
│   │   ├── payment/            # SSLCommerz payment flow
│   │   └── public/             # Public endpoints (cities, areas, available ads)
│   ├── templates/              # EJS email templates
│   └── utils/                  # AppError, catchAsync, jwt, otp, sendEmail, sendResponse
└── generated/prisma/           # Generated Prisma client (gitignored)
```

### Request Flow

```
Client → Express App (app.ts)
       → Route (module/*/route.ts)   → auth middleware (JWT + role check)
                                      → validateRequest (Zod schema)
       → Controller                   → Service (Prisma queries + business logic)
       → Response (sendResponse)
```

- **Route** — declares method, path, and role-based auth.
- **Middleware** — `checkAuth` verifies the JWT (cookie or `Authorization: Bearer`), checks role, email verification, and user status.
- **Validation** — Zod schemas per endpoint. For routes with dynamic params, `validateRequestNew` validates `{ body, query, params }` together.
- **Controller** — thin; extracts `req.user`, `req.body`, `req.params`, `req.query` and calls the service.
- **Service** — the business layer; all Prisma access and error throwing (via `AppError`) happens here.
- **Errors** — `AppError` carries an HTTP status; `globalErrorHandler` formats the error JSON.
- **Response** — every successful response uses the standard shape below.

### Data Models (overview)

| Model | Purpose |
| --- | --- |
| `User` (+ `OwnerProfile`, `ManagerProfile`, `TenantProfile`) | Users and role profiles |
| `Property` → `Flat` → `Room` | Property hierarchy with images |
| `PropertyOwnership` / `ManagerAssignment` | Who owns / manages a flat |
| `Advertisement` | Rental / roommate listings (flat or room target) |
| `Application` | Tenant applications against an advertisement |
| `Stay` | Confirmed/active booking (from an approved application) |
| `Invoice` | Rent (RENT) and utility (UTILITY) bills |
| `Payment` | Payments with gateway info |
| `ViewingRequest` | Flat/room viewing requests |
| `City` / `Area` | Location hierarchy for properties |
| `Notification` | System notifications |

### Authentication & Authorization

- **Roles:** `ADMIN`, `OWNER`, `MANAGER`, `TENANT`.
- **Token transport:** access + refresh tokens are set as `httpOnly` cookies and also returned in the login response. The access token can alternatively be sent as `Authorization: Bearer <token>`.
- Access tokens are short-lived and refreshed via `POST /api/v1/auth/refresh-token`.
- Users must verify their email (OTP) after registration; account status gates access (e.g. `PENDING_APPROVAL` / `SUSPENDED` / `REJECTED`).

## API Reference

**Base URL:** `http://localhost:5000/api/v1`

### Standard Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```

`meta` is present on paginated list endpoints. Errors use the same shape with `success: false` and an `error` section (message + stack in development).

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Request Body | Description |
| --- | --- | --- | --- | --- |
| POST | `/register` | Public | `{ name, email, password, role (OWNER\|MANAGER\|TENANT), phone? }` | Register a user; sends OTP email |
| POST | `/verify` | Public | `{ email, otp }` | Verify email + create role profile |
| POST | `/login` | Public | `{ email, password }` | Login; returns tokens + user |
| POST | `/refresh-token` | Cookie | — | Issue new access/refresh tokens |
| POST | `/google` | Public | `{ idToken }` | Google login/register (TENANT) |
| POST | `/forgot-password` | Public | `{ email }` | Send password-reset OTP |
| POST | `/reset-password` | Public | `{ email, otp, newPassword }` | Reset password with OTP |
| PATCH | `/update-profile` | OWNER, MANAGER, TENANT | `{ nid?, address?, occupation? }` | Update the user's role profile |

> **Register constraints:** password ≥ 6 chars with at least one letter and one digit; role cannot be `ADMIN`.

### Admin (`/api/v1/admin` — role: `ADMIN`)

| Method | Endpoint | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/users` | `?role=&status=&search=&page=&limit=&sortBy=&sortOrder=` | List users |
| GET | `/users/:id` | — | Get user by ID |
| PATCH | `/users/:id/status` | `{ status: ACTIVE\|SUSPENDED\|REJECTED }` | Update user status |
| PATCH | `/users/:id/role` | `{ role: OWNER\|MANAGER\|TENANT }` | Update user role |
| POST | `/cities` | `{ name }` | Create a city |
| POST | `/areas` | `{ cityId, name }` | Create an area |

### Owner (`/api/v1/owner` — role: `OWNER`)

| Method | Endpoint | Request Body / Note | Description |
| --- | --- | --- | --- |
| POST | `/properties` | `{ name, type (SINGLE_FLAT\|MULTI_FLAT), description?, address, areaId, postalCode?, latitude?, longitude? }` | Create a property |
| GET | `/properties` | — | List my properties |
| GET | `/flats` | — | List my flats |
| GET | `/advertisements` | — | List my advertisements |
| GET | `/managers` | — | List active managers |
| POST | `/properties/:propertyId/flats` | `multipart/form-data` `images` (≤10) + flat fields | Add a flat with images |
| POST | `/flats/:flatId/rooms` | `multipart/form-data` `images` (≤10) + room fields | Add a room with images |
| POST | `/flats/:flatId/assign-manager` | `{ managerId }` | Assign a manager to a flat |
| POST | `/flats/:flatId/revoke-manager` | — | Revoke the flat's manager |
| POST | `/flats/:flatId/images` | `multipart/form-data` `images` (≤10) | Upload flat images |
| POST | `/rooms/:roomId/images` | `multipart/form-data` `images` (≤10) | Upload room images |
| PATCH | `/flats/:flatId` | `{ flatNumber?, floorNumber?, bedrooms?, bathrooms?, areaSqFt?, description? }` | Update flat |
| PATCH | `/rooms/:roomId` | `{ roomNumber?, name?, areaSqFt?, description? }` | Update room |
| DELETE | `/flats/:flatId/images/:imageId` | — | Remove a flat image |
| DELETE | `/rooms/:roomId/images/:imageId` | — | Remove a room image |
| DELETE | `/flats/:flatId` | — | Delete flat |
| DELETE | `/rooms/:roomId` | — | Delete room |

### Advertisement (`/api/v1/advertisements` — role: `OWNER`, `MANAGER`)

| Method | Endpoint | Request Body | Description |
| --- | --- | --- | --- |
| POST | `/flats/:flatId` | `{ title, description?, monthlyRent, availableFrom, availableTo }` | Create a flat (entire-flat) advertisement |
| POST | `/rooms/:roomId` | `{ title, description?, monthlyRent, availableFrom, availableTo }` | Create a room advertisement |
| PATCH | `/:advertisementId/status` | `{ status: PUBLISHED\|UNPUBLISHED\|ARCHIVED }` | Update advertisement status |
| PATCH | `/:advertisementId` | `{ title?, description?, monthlyRent?, availableFrom?, availableTo? }` | Update advertisement details |
| POST | `/utility-invoices` | `{ stayId, amount, billingPeriodStart, billingPeriodEnd, description? }` | Create a utility invoice for a confirmed stay |
| PATCH | `/utility-invoices/:invoiceId` | `{ amount?, billingPeriodStart?, billingPeriodEnd?, description?, status? }` | Update a utility invoice (at least one field) |

**Utility invoice notes:**

- Created only for stays with status `CONFIRMED`; payer must be a tenant; receiver is the flat's active owner.
- Only the flat's assigned manager or owning owner may create/update.
- `status` may be `PENDING`, `PAID`, or `CANCELLED`. **Paid invoices cannot be updated.**
- `billingPeriodStart` must be before `billingPeriodEnd`.

**Contract conflict rules at creation:**
- A flat/room cannot be advertised if it is already advertised in an overlapping period (statuses `DRAFT`/`PUBLISHED`/`UNPUBLISHED`/`RENTED`/`FULL`).
- It cannot be advertised if it has an active booking/stay (`WAITING_FOR_PAYMENT` or `CONFIRMED`) in the same period.
- `availableFrom` must not be in the past; `availableTo` must be after `availableFrom`.

### Manager (`/api/v1/manager`)

| Method | Endpoint | Auth | Query / Body | Description |
| --- | --- | --- | --- | --- |
| GET | `/applications` | OWNER, MANAGER | `?status=&page=&limit=` | List applications for owned/managed flats |
| GET | `/advertisements` | MANAGER | — | List advertisements of assigned flats |

### Tenant (`/api/v1/tenant`)

| Method | Endpoint | Auth | Request Body / Query | Description |
| --- | --- | --- | --- | --- |
| POST | `/viewing-requests` | TENANT | `{ advertisementId, requestedDate, note? }` | Create a viewing request |
| GET | `/viewing-requests` | TENANT, OWNER, MANAGER | `?status=&page=&limit=` | List viewing requests |
| GET | `/viewing-requests/:id` | TENANT, OWNER, MANAGER | — | Get viewing request by ID |
| PATCH | `/viewing-requests/:id/status` | TENANT, OWNER, MANAGER | `{ status: APPROVED\|REJECTED\|COMPLETED\|NO_SHOW\|CANCELLED }` | Update viewing request status |
| PATCH | `/viewing-requests/:id` | OWNER, MANAGER | `{ status?, approvedDate?, noteByReviewer? }` (≥1 field) | Update viewing request |
| POST | `/applications` | TENANT | `{ advertisementId, requestedStartDate (YYYY-MM-DD), requestedEndDate, note? }` | Apply for a stay |
| GET | `/applications` | TENANT | `?status=&page=&limit=` | List my applications |
| GET | `/applications/:id` | TENANT, OWNER, MANAGER | — | Get application by ID |
| PATCH | `/applications/:id` | TENANT, OWNER, MANAGER | `{ status: APPROVED\|REJECTED\|WITHDRAWN }` | Update application status |
| GET | `/invoices` | TENANT, OWNER, MANAGER | `?status=&page=&limit=` | List invoices |
| GET | `/invoices/by-stay` | TENANT, OWNER, MANAGER | `?applicationId=&stayId=` (one required) | List invoices for a stay |
| GET | `/invoices/:id` | TENANT, OWNER, MANAGER | — | Get invoice by ID |
| GET | `/stays` | TENANT, OWNER, MANAGER | — | List stays |

### Payment (`/api/v1/payments`)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/create/:invoiceId` | TENANT | Initiate SSLCommerz payment for an invoice |
| POST | `/confirm/:status` | Public (gateway) | SSLCommerz success/fail/cancel callback (`?tranId=` + body) |
| GET | `/check/:tranId` | Public | Check gateway payment status by transaction ID |
| GET | `/` | TENANT | List my payments (`?page=&limit=`) |
| GET | `/:id` | TENANT | Get payment details by ID |

### Public (`/api/v1` — no auth)

| Method | Endpoint | Query | Description |
| --- | --- | --- | --- |
| GET | `/cities` | `?search=&page=&limit=` | List cities with their areas |
| GET | `/areas` | `?cityId=&search=&page=&limit=` | List areas with property counts |
| GET | `/available-advertisements` | `?areaId=&from=&to=&page=&limit=` (`areaId` required) | List published ads available in a date range |
| GET | `/available-advertisements/:advertisementId` | — | Get public advertisement details |

## Notes

- This is an early-stage project; some routes/middleware structure may still change.
- The seed script (`prisma/seed.ts`) uses hardcoded `providerId` and `categoryId` UUIDs and will fail if those records don't already exist. Uncomment/adjust seed data before running.
- The Prisma schema is split across `prisma/schema/*.prisma` (one file per model, plus `enums.prisma`). The Prisma client is generated to `generated/prisma/`.