# Database entities & relationships

Executable source of truth: `apps/api/prisma/schema.prisma`. This document summarizes the
relationships in prose; see the schema file for exact columns, constraints, and indexes.

## Core relationship groups

**Identity**
`User` 1—1 `CustomerProfile` (optional), `User` 1—1 `PlumberProfile` (optional),
`User` 1—N `UserSession`, `User` 1—N `PolicyAcceptance` → `LegalPolicyVersion`.

**Customer**
`CustomerProfile` 1—N `CustomerAddress`. `CustomerProfile` 1—N `ServiceRequest` (Phase 1
manual-mode entry point) and 1—N `Booking` (Phase 2 self-serve entry point) — both funnel
into the same downstream tables once a plumber is engaged.

**Plumber & verification**
`PlumberProfile` N—1 `PlumbingBusiness` (a business can have multiple plumber users).
`PlumberProfile` 1—N `PlumberLicense`, 1—N `PlumberInsuranceDocument`, 1—N
`VerificationReview` (admin decision history). `PlumberProfile` 1—N `PlumberService`
(category + pricing), 1—N `PlumberServiceArea` → `ServiceZone`, 1—N `AvailabilityRule`,
1—N `AvailabilityException`.

**Service catalogue**
`ServiceCategory` 1—N `PlumberService`, referenced by `ServiceRequest`/`Booking`.
`ServiceZone` defines coverage (postal-code prefix list, radius, or polygon), referenced by
`PlumberServiceArea` and used to validate incoming requests.

**Booking lifecycle**
`Booking` 1—N `BookingStatusHistory` (append-only), 1—N `DispatchOffer`, 1—N
`LocationEvent` (job-scoped tracking), 1—N `Media` (photos/video), 1—N `Estimate` → N
`EstimateVersion` → N `EstimateLineItem`, 1—N `CustomerApproval`, 1—N `ChangeOrder`, 1—1
`Invoice` → N `InvoiceLineItem`, 1—N `Message` → N `MessageAttachment`, 0—1 `Review`, 0—N
`Dispute`, 0—N `SupportCase`.

**Money**
`Invoice` 1—N `PaymentTransaction` (supports partial/retry), `PaymentTransaction` 1—N
`Refund`, `PaymentTransaction` 1—1 `PlatformFee` breakdown row, `PlumberProfile` 1—N
`Payout` (aggregates paid transactions minus commission), `PaymentMethodRef` stores only
the payment-provider token, never raw card data.

**Trust**
`Review` N—1 `Booking`, N—1 `CustomerProfile`, N—1 `PlumberProfile`, 0—N `ReviewReport`,
0—1 plumber response (columns on `Review`, kept simple for MVP rather than a separate
table since a review has at most one response).

**Growth (Phase 5, schema-ready)**
`SubscriptionPlan` 1—N `Subscription` (plumber ↔ plan), `Promotion` (founding-plumber
commission, generalized to support future promo types via a `type` discriminator + JSON
`params`), designed so annual maintenance memberships / commercial contracts can be added
as new `Promotion`/`SubscriptionPlan` rows or a small number of new tables without
altering the booking/payment core.

**Platform**
`AuditLog` (append-only, polymorphic target via `targetType`/`targetId`),
`AnalyticsEvent` (typed `eventName` + JSON `properties`, PII-minimized by convention —
enforced by the shared analytics helper, not the DB), `FeatureFlag` (key/value + rollout
notes), `AppSetting` (typed key/value store for commission %, HST %, cancellation windows,
matching weights, emergency fee config), `LegalPolicyVersion` (versioned ToS/Privacy/etc.,
linked to `PolicyAcceptance`).

## Constraints & indexes of note

- `ServiceZone` and `PlumberServiceArea` use PostGIS `geography(Point)`/`geography(Polygon)`
  columns with GiST indexes for radius/containment queries.
- `Booking.status` + `createdAt` composite index for the admin queue and dispatch scans.
- Unique constraint: one active `Review` per (`bookingId`, `customerId`).
- Unique constraint: one `PlumberService` per (`plumberProfileId`, `categoryId`).
- Check constraint: all money columns (`*Cents`) are `INTEGER` and `>= 0` (refund/credit
  amounts use a signed ledger row instead of negative totals).
- `BookingStatusHistory`, `AuditLog`, `EstimateVersion`, `AnalyticsEvent` are insert-only —
  no update/delete path is exposed in the API layer.
- Soft delete (`deletedAt`) is used only where a legal/operational need to retain-but-hide
  exists (e.g. `User`, `Review`); operational/junction tables use hard delete or are
  naturally immutable.
