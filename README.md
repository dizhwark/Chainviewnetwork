# MAYBE — Toronto plumbing-services marketplace

MAYBE (working name — see [Renaming the product](#renaming-the-product)) connects customers
who need plumbing work with verified, licensed, insured plumbers in the Greater Toronto
Area. This repo is a TypeScript monorepo: a NestJS API, a Next.js PWA (public site,
customer flow, and admin portal), and shared packages for types, pricing math, and the
booking state machine.

**Start here:** [`docs/architecture.md`](docs/architecture.md) is the full Phase 0 product
and architecture spec (roles, journeys, feature matrix, state machine, permissions,
database design, third-party services, phases, assumptions, and what still needs
professional/legal review). This README is about running the code.

## What's actually built vs. scaffolded

This is being delivered in phases, as instructed. **Phase 0 (spec) and Phase 1 (a working
"manual validation" marketplace) are complete and functional this session.** Phase 2+
(full self-serve booking workflow, live matching, real-time tracking, in-app messaging,
Stripe Connect payouts, disputes UI) has its **database schema and module skeletons in
place**, but the business logic is not implemented yet — see
[`docs/feature-matrix.md`](docs/feature-matrix.md) for the exact status of every feature in
the product brief, and [`docs/backlog-deferred-features.md`](docs/backlog-deferred-features.md)
for what's explicitly out of scope for now.

Concretely, Phase 1 ships:

- Public marketing site (home, how it works, services, emergency, browse plumbers, plumber
  profiles, become a plumber, pricing, trust & safety, FAQ, contact, legal-template pages)
- A real coverage checker backed by admin-configurable service zones
- A customer service-request form (no account required) that writes to Postgres, uploads
  photos to S3-compatible storage, and gives the customer a status-lookup link
- A plumber application form with licence/insurance document upload
- Admin sign-in (email/password + JWT sessions) and a full admin portal: dashboard, request
  queue, manual plumber assignment, status updates, plumber application review/approval,
  manual invoice entry with commission/HST/emergency-fee calculation, Stripe payment links
  (or a dev mock when no Stripe key is configured), admin-issued refunds, an append-only
  audit log, and feature-flag/commission/tax settings
- Post-completion review collection
- Server-side analytics event logging for the funnels defined in the product brief

## Monorepo layout

```
apps/
  api/      NestJS backend (REST API, Prisma/PostgreSQL, WebSocket gateway scaffolding)
  web/      Next.js PWA — public site, customer flow, admin portal
packages/
  config/   Single source of truth for the product name/brand, locale, business defaults,
            and feature-flag defaults
  shared/   Shared types, Zod schemas, integer-cents pricing math, the booking state
            machine, the permissions matrix, and the matching-ranking function — all
            unit-tested and imported by both apps/api and apps/web
docs/       Phase 0 spec: architecture, feature matrix, booking state machine, permissions
            matrix, database ERD, backlog, and required legal/professional review items
```

## Renaming the product

The product name lives in exactly one place: [`packages/config/src/branding.ts`](packages/config/src/branding.ts).
Change `BRAND.name` there (or set `PRODUCT_NAME` / `NEXT_PUBLIC_PRODUCT_NAME` in your
environment to override it without a rebuild) and it propagates everywhere — page titles,
the admin portal header, email copy, legal-page text, etc.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres/PostGIS, Redis, and MinIO) — or install those natively if you
  prefer, see `docker-compose.yml` for the exact versions/credentials expected
- No paid accounts are required to run this locally. Every external service (Stripe, a map
  provider, email, SMS) has a documented, functional dev fallback — see
  [`.env.example`](.env.example) and `docs/architecture.md` §8.

## Local setup (exact commands)

```bash
# 1. Install dependencies (also builds packages/config and packages/shared)
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start Postgres (with PostGIS), Redis, and MinIO
docker compose up -d postgres redis minio minio-init

# 4. Run database migrations
npm run prisma:migrate --workspace apps/api -- --name init
#    (on a fresh clone this creates the DB schema; the PostGIS geography-column
#    migration additionally requires the PostGIS extension — already present in
#    the postgis/postgis image docker-compose uses)

# 5. Seed clearly-labelled demo data (admin, customers, plumbers, sample bookings, etc.)
npm run seed --workspace apps/api

# 6. Run the API and the web app (in two terminals)
npm run dev:api    # http://localhost:4000  (Swagger docs at /docs)
npm run dev:web    # http://localhost:3000
```

Demo sign-in (development only — printed by the seed script, and the seed script refuses
to run with `NODE_ENV=production`):

- Admin portal (`http://localhost:3000/admin/sign-in`): `admin@maybe.example` /
  `ChangeMe123!` (or whatever `SEED_ADMIN_PASSWORD` you set in `.env`)
- Demo customers/plumbers: see the console output of the seed script for the full list —
  every demo account shares the same password.

### Or: everything via Docker Compose

```bash
cp .env.example .env
docker compose up --build
# then, once containers are healthy, in a separate shell:
docker compose exec api npm run seed --workspace apps/api
```

The API's container command runs `prisma migrate deploy` automatically on startup;
the PostGIS geography-column migration will apply since the `postgres` service uses the
`postgis/postgis` image.

## Configuring external services

Every integration works out of the box in a safe, clearly-labelled dev/mock mode and can be
switched to the real provider by setting environment variables — see the fully-commented
[`.env.example`](.env.example) for exactly which variables to set and where to get them for:

- **Stripe** (marketplace payments, `PAYMENTS_PROVIDER=stripe`) — test-mode keys at
  `dashboard.stripe.com/test/apikeys`. Webhook testing locally: `stripe listen --forward-to
  localhost:4000/api/v1/payments/webhook` (Stripe CLI), then copy the printed signing secret
  into `STRIPE_WEBHOOK_SECRET`.
- **Maps** (Mapbox or Google Maps, `MAP_PROVIDER=mapbox|google`) — without a key, a
  deterministic mock geocoder handles common Toronto postal codes so coverage checks and
  address entry keep working.
- **Email** (`EMAIL_PROVIDER=console|smtp`) — console mode logs emails to the API's stdout.
- **SMS/masked calling** (Twilio, feature-flagged off by default) — console mode logs
  instead of sending.
- **Object storage** — MinIO via docker-compose locally; point at any S3-compatible bucket
  in production.

## Tests

```bash
npm run test --workspace packages/shared   # pricing/commission math, booking state
                                            # machine, matching-ranking — 17 tests
npm run test --workspace apps/api          # RBAC guard, invoice calculation, plumber
                                            # eligibility/assignment — 9 tests
```

Both suites pass as of this commit (26/26). See [Known limitations](#known-limitations) for
what test coverage does **not** yet include.

## Build / typecheck

```bash
npm run build            # builds packages/config, packages/shared, apps/api, apps/web
npm run lint              # ESLint across every workspace — clean as of this commit
```

## Formatting

```bash
npm run format            # Prettier, writes in place
```

## Troubleshooting

- **`prisma migrate dev` fails with a PostGIS-related error locally (no Docker):** the
  geography-column migration (`20260908151600_postgis_geography_columns`) requires the
  PostGIS extension. If you're running a plain `postgres` image or a local install without
  PostGIS, either install the extension or skip that specific migration — the app still
  functions using plain lat/lng columns and in-application distance math at this scale.
- **Web app shows empty categories/plumbers lists:** confirm the API is running and
  reachable at `NEXT_PUBLIC_API_BASE_URL` (browser-facing) / `API_BASE_URL` (server-side,
  used by Next.js Server Components — inside Docker this must be the service name, e.g.
  `http://api:4000`, not `localhost`).
- **Stripe webhook signature errors:** make sure `STRIPE_WEBHOOK_SECRET` matches what the
  Stripe CLI (or your Stripe dashboard endpoint) printed — it rotates each time you restart
  `stripe listen`.
- **"No space left on device" during `npm install`:** this indicates disk quota, not a
  broken environment — remove `node_modules`/`.next`/`dist` build artifacts you don't need
  and retry.

## Known limitations

Documented honestly rather than glossed over:

- Phase 2+ features (full self-serve customer/plumber accounts beyond the request/apply
  forms, automatic matching dispatch loop, live GPS tracking, in-app messaging, Stripe
  Connect plumber payout onboarding, subscriptions, sponsored placement, the full disputes
  workflow UI) are **schema-ready but not implemented** — see `docs/feature-matrix.md`.
- The Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`) have **not** been exercised
  against a live Docker daemon in this development environment (no daemon was available) —
  they build cleanly by inspection and follow a standard npm-workspaces monorepo pattern,
  but verify them in your own Docker setup before relying on them for production.
- Google/Apple sign-in are architected (env vars, `User` table columns for provider
  subject IDs) but not wired to live OAuth apps — there's nothing to configure without your
  own OAuth client credentials.
- WebSocket gateway, live location tracking, and in-app messaging have data models
  (`LocationEvent`, `Message`, `MessageAttachment`) but no gateway implementation yet.
- End-to-end/browser tests are not included — testing so far is unit-level (pricing math,
  state machine transitions, matching ranking, RBAC guard behavior, invoice calculation,
  plumber-eligibility enforcement) plus manual verification of the full Phase 1 flow
  (request → assign → complete → invoice → payment → review → admin dashboard → refund)
  against a real Postgres database.
- Legal/policy pages are clearly-labelled templates, not reviewed legal text — see
  [`docs/legal-and-professional-review.md`](docs/legal-and-professional-review.md).
- Do not deploy the demo seed data or its shared password to any environment reachable by
  real users.

## Deployment

Not yet documented in depth — this is Phase 1 of a phased build, and infra/deployment
hardening is Phase 4 territory. The Docker images in this repo are a reasonable starting
point for a single-host or managed-container deployment (Fly.io, Railway, ECS, etc.): point
`DATABASE_URL` at a managed PostgreSQL instance with the PostGIS extension enabled, run
`prisma migrate deploy` as a release step, and set every credential in `.env.example` to a
real value (never the demo seed password). A fuller deployment guide (backups, monitoring,
zero-downtime migration strategy) is tracked as follow-up work, not included here.
