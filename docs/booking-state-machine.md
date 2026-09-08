# Booking state machine

Source of truth in code: `packages/shared/src/state-machine/booking.ts`. The API is the
only writer of booking status; the web app never mutates status locally except as
optimistic UI that is reconciled with the server response.

## States

`DRAFT, REQUESTED, SEARCHING, OFFERED, ACCEPTED, EN_ROUTE, ARRIVED, INSPECTION_IN_PROGRESS,
ESTIMATE_PENDING, ESTIMATE_APPROVED, ESTIMATE_REJECTED, WORK_IN_PROGRESS, WORK_PAUSED,
WORK_COMPLETED, COMPLETION_CONFIRMATION_PENDING, PAYMENT_PROCESSING, PAID,
CANCELLED_BY_CUSTOMER, CANCELLED_BY_PLUMBER, CANCELLED_BY_ADMIN, DISPUTED,
PARTIALLY_REFUNDED, REFUNDED, CLOSED, NO_PLUMBER_AVAILABLE, NO_SHOW`

## Transition table

| From | To | Actor(s) | Required data | Side effects |
|---|---|---|---|---|
| DRAFT | REQUESTED | customer | address, category, urgency, contact | analytics: `request_submitted`; notify admins |
| REQUESTED | SEARCHING | system/admin | — | starts matching (auto) or surfaces in admin queue (manual) |
| SEARCHING | OFFERED | system | dispatch offer + acceptance window | notification to offered plumber(s) |
| SEARCHING | NO_PLUMBER_AVAILABLE | system | radius/batches exhausted | notify customer with fallback options |
| OFFERED | ACCEPTED | plumber (or admin, manual mode) | plumber id, accepted-at | DB transaction w/ row lock to prevent double-accept; notify customer; other offers marked `expired` |
| OFFERED | SEARCHING | system | offer expired/declined | continue dispatch to next batch |
| ACCEPTED | EN_ROUTE | plumber | started-travel timestamp | begin location sharing (Phase 3) |
| ACCEPTED | CANCELLED_BY_PLUMBER | plumber | reason | re-enter SEARCHING or notify customer |
| ACCEPTED | CANCELLED_BY_CUSTOMER | customer | reason | cancellation policy fee check |
| EN_ROUTE | ARRIVED | plumber | arrival timestamp | stop live tracking to customer view |
| EN_ROUTE | NO_SHOW | admin/system | timeout/report | notify customer, reopen dispatch |
| ARRIVED | INSPECTION_IN_PROGRESS | plumber | — | |
| INSPECTION_IN_PROGRESS | ESTIMATE_PENDING | plumber | estimate line items | notify customer |
| ESTIMATE_PENDING | ESTIMATE_APPROVED | customer | approval timestamp, estimate version id | required before non-emergency work starts |
| ESTIMATE_PENDING | ESTIMATE_REJECTED | customer | reason | booking may close or a new estimate version is created |
| ESTIMATE_APPROVED | WORK_IN_PROGRESS | plumber | start timestamp | |
| WORK_IN_PROGRESS | WORK_PAUSED | plumber | reason | |
| WORK_PAUSED | WORK_IN_PROGRESS | plumber | — | |
| WORK_IN_PROGRESS | WORK_COMPLETED | plumber | completion timestamp, notes/photos | generate invoice |
| WORK_COMPLETED | COMPLETION_CONFIRMATION_PENDING | system | — | notify customer to confirm |
| COMPLETION_CONFIRMATION_PENDING | PAYMENT_PROCESSING | customer or timeout | confirmation or auto-confirm window elapsed | trigger payment capture |
| PAYMENT_PROCESSING | PAID | system (webhook) | provider transaction id | commission + payout ledger entries created |
| PAYMENT_PROCESSING | DISPUTED | system | webhook chargeback/dispute event | freeze payout |
| any active state | CANCELLED_BY_ADMIN | administrator | reason | full audit log entry |
| PAID | DISPUTED | customer (via support case) | dispute reason + evidence | |
| DISPUTED | PARTIALLY_REFUNDED | administrator | refund amount, reason | audit log, ledger entry |
| DISPUTED | REFUNDED | administrator | reason | audit log, ledger entry |
| DISPUTED | CLOSED | administrator | resolution notes, no-refund | audit log |
| PARTIALLY_REFUNDED / REFUNDED / PAID | CLOSED | system | — | terminal |

Invalid transitions are rejected with HTTP 409 and a structured error; the guard function
`canTransition(from, to, actor)` is pure and unit-tested (`packages/shared`).
