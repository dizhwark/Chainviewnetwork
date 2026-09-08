# MAYBE — Product & Architecture Specification (Phase 0)

> **MAYBE** is a working name. It is defined in one place —
> [`packages/config/src/branding.ts`](../packages/config/src/branding.ts) — and can be
> renamed by changing that file (and optionally `PRODUCT_NAME` / `NEXT_PUBLIC_PRODUCT_NAME`
> env vars) without touching business logic anywhere else.

## 1. Product understanding

MAYBE is a two-sided marketplace connecting customers who need plumbing work done with
verified, licensed, insured plumbers in the Greater Toronto Area, launching in one
configurable service zone (default: Downtown Toronto).

Core loop: customer describes a plumbing problem and address → platform matches (or an
admin manually assigns, during the manual-validation phase) an eligible plumber → plumber
travels, diagnoses, and produces an itemized estimate → customer approves → work happens →
invoice is generated → payment is captured through the marketplace payment processor →
platform takes a configurable commission → plumber is paid out → customer leaves a
verified review.

The product must work in two operating modes simultaneously, because the business needs to
be validated with real users before the automatic-matching engine is trusted with real
money and real emergencies:

- **Manual-validation mode** (Phase 1): customers submit requests from a public landing
  page; an administrator calls/messages plumbers and manually assigns; payment can happen
  via a Stripe Checkout/payment link; invoices are recorded manually.
- **Marketplace mode** (Phase 2+): full self-serve accounts, automatic matching, live
  booking state machine, in-app payments, live tracking, in-app messaging.

## 2. User roles

| Role | Description |
|---|---|
| Visitor | Unauthenticated browser of the public site |
| Customer | Authenticated account that can submit service requests / bookings |
| Plumber applicant | Submitted a plumber application, not yet approved |
| Verified plumber | Approved, license/insurance verified, can accept jobs |
| Suspended plumber | Previously verified, currently blocked from new jobs |
| Support agent | Can view/respond to support cases and disputes, cannot change money-moving config |
| Administrator | Full operational control: verification, dispatch override, refunds, config |
| Super administrator | Administrator + can manage other admins and irreversible platform config |

All permission checks are enforced server-side (NestJS guards + object-level ownership
checks). See [`permissions-matrix.md`](./permissions-matrix.md) — hiding a UI button is
never treated as authorization.

## 3. Key user journeys

1. **Customer request → paid job** (see full 21-step flow in the top-level task spec；
   implemented incrementally: Phase 1 ships address → problem → contact → manual
   assignment → payment link → invoice → review; Phase 2+ ships the full in-app flow).
2. **Plumber onboarding**: apply → upload license/insurance → admin review → approved/
   rejected/more-info → configure services/areas/availability → go online → receive jobs.
3. **Admin manual dispatch**: see incoming request → call/message plumbers off-platform →
   assign the accepting plumber → update status → record outcome.
4. **Dispute**: customer reports a problem on a completed booking → evidence attached →
   plumber responds → admin reviews → partial/full refund or no-refund resolution, fully
   audited.

## 4. MVP feature matrix

See [`feature-matrix.md`](./feature-matrix.md) for the full table. Summary:

| Phase | Ships this session | Status |
|---|---|---|
| Phase 0 | Spec, ERD, state machine, permissions matrix | Done (this doc set) |
| Phase 1 | Public site, coverage check, customer request form, plumber application form, admin sign-in + dashboard, manual assignment, status updates, Stripe payment link, manual invoice recording, review collection, analytics events | Built & functional this session |
| Phase 2 | Full auth, self-serve booking workflow, estimates, Stripe Connect, automatic matching, admin portal expansion | Schema + module skeletons in place; business logic **not** implemented this session — documented as next milestone |
| Phase 3 | Real-time presence/tracking, WebSocket dispatch, in-app messaging, push | Schema in place; not implemented |
| Phase 4 | Disputes workflow UI, advanced audit, reconciliation, hardening | Data model in place (disputes, audit log tables + basic admin refund action in Phase 1 scope); full workflow not implemented |
| Phase 5 | Subscriptions, sponsored placement, referrals, multi-zone | Data model in place; feature-flagged off |

## 5. Booking state machine

See [`booking-state-machine.md`](./booking-state-machine.md) for the full transition table
(states, allowed actors, required data, side effects). Implemented in code at
`packages/shared/src/state-machine/booking.ts` as the single source of truth used by both
the API (authoritative) and the web app (optimistic UI only).

## 6. Permissions matrix

See [`permissions-matrix.md`](./permissions-matrix.md).

## 7. Database entities & relationships

See [`database-erd.md`](./database-erd.md) and the executable source of truth at
`apps/api/prisma/schema.prisma`, which contains every entity listed in the product spec's
"Database Design" section with keys, constraints, and indexes, so later phases build on a
complete schema instead of re-migrating core tables.

## 8. Required third-party services & recurring cost categories

| Service | Purpose | Dev fallback | Est. recurring cost category |
|---|---|---|---|
| Stripe Connect | Marketplace payments, payouts, subscriptions | Stripe test mode (no real charges); `PAYMENTS_PROVIDER=stripe_test` or `mock` adapter that logs instead of calling Stripe when no key is set | % of transaction volume + monthly Stripe fees; free in test mode |
| Map provider (Mapbox or Google Maps) | Geocoding, autocomplete, distance, live markers | `MAP_PROVIDER=mock` returns deterministic canned geocode results for Toronto postal codes when no API key is set | Usage-based, low cost at MVP volume, free tiers available |
| Email provider (Postmark/SendGrid/SES via abstraction) | Verification, notifications, receipts | `EMAIL_PROVIDER=console` logs emails to server console/log file | Usage-based, near-free at MVP volume |
| Twilio (optional, flagged off by default) | SMS, masked calling | `SMS_PROVIDER=console` logs instead of sending | Usage-based per SMS/min, only incurred if enabled |
| Object storage (S3-compatible) | License/insurance docs, job photos | Local MinIO container in `docker-compose.yml`, same S3 API as production | Storage + egress, low at MVP volume |
| Sentry-compatible error monitoring | Error tracking | No-op logger if `SENTRY_DSN` unset | Free tier covers MVP |
| Web Push (VAPID) | Browser push notifications | Self-hosted, free (no vendor); `WEB_PUSH_VAPID_PUBLIC_KEY`/`PRIVATE_KEY` generated locally | Free |

No external service is ever simulated silently in a way that could be mistaken for a real
integration in production — every adapter that falls back to a dev/mock mode logs a
visible `[DEV FALLBACK]` warning and the admin config screen (Phase 2) will show
integration status.

## 9. Implementation phases

Phases 0–5 as specified in the task brief. See the feature matrix above for what ships
this session vs. what is scaffolded vs. what is pure backlog
([`backlog-deferred-features.md`](./backlog-deferred-features.md)).

## 10. Key assumptions (recorded defaults, not blocking)

1. Default launch zone: Downtown Toronto, configurable via `ServiceZone` records (postal
   prefix list, not hard-coded).
2. Default commission: 15%, configurable 0–20% via `AppSetting`.
3. Default HST: 13% (Ontario), configurable per `AppSetting`, applied to labour + materials
   per current CRA/Ontario guidance at a high level — **requires accountant review**, see
   `legal-and-professional-review.md`.
4. Currency: CAD, integer cents everywhere, no floats in money math
   (`packages/shared/src/pricing`).
5. Time zone: `America/Toronto` for all scheduling logic and display.
6. Auth: email/password with argon2 hashing + short-lived JWT access token / rotating
   refresh token in httpOnly secure cookies; Google/Apple sign-in are architected
   (provider-abstracted `AuthProvider` interface + DB columns) but not wired to live OAuth
   apps without credentials.
7. Manual-validation mode (Phase 1) uses a Stripe **Payment Link** (or a mock link in dev)
   rather than full Connect onboarding, since plumbers aren't self-serve yet in Phase 1.
8. Tips, SMS, masked calling, subscriptions, sponsored placement, live GPS, and automatic
   matching all default **off** via feature flags per the spec, and are turned on
   incrementally in later phases.
9. Seed/demo data is always labelled `isDemoData: true` and the UI renders a visible
   "Demonstration data" badge on any record with that flag.

## 11. Legal, insurance, tax, and operational items requiring professional review

See [`legal-and-professional-review.md`](./legal-and-professional-review.md) — this is a
non-exhaustive list of items that must be reviewed by an Ontario lawyer, a privacy
professional, an accountant, and an insurance adviser before real money or real personal
data flows through the platform. Nothing in this codebase should be read as legal advice
or as a claim of compliance.

## 12. First implementation milestone

Phase 1: a working, deployable "manual validation" product — public marketing site with a
real coverage checker, a real customer service-request form that writes to Postgres, a
real plumber application form with document upload to S3-compatible storage, an admin
portal with authenticated sign-in, a request queue, manual plumber assignment, status
updates visible to the customer via a lookup link, Stripe payment-link generation (or dev
mock), manual invoice entry, post-job review collection, and server-side analytics event
logging for the funnels defined in the spec. This is what ships in this session.
