# Permissions matrix

Enforced server-side via NestJS guards (`RolesGuard`) + object-level ownership checks
(`OwnershipGuard` — e.g. a customer may only read their own bookings, a plumber only their
own documents/payouts). The frontend hides controls the user can't use, but every mutating
endpoint re-checks role **and** row ownership independently of what the UI sent.

Legend: ✅ allowed · 🔶 own records only · ❌ forbidden

| Action | Visitor | Customer | Plumber applicant | Verified plumber | Suspended plumber | Support agent | Admin | Super admin |
|---|---|---|---|---|---|---|---|---|
| Browse public site / plumber profiles | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit service request | ✅ (Phase 1 form) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View own bookings | ❌ | 🔶 | ❌ | ❌ | ❌ | ✅ (support) | ✅ | ✅ |
| View own plumber application/docs | ❌ | ❌ | 🔶 | 🔶 | 🔶 | ✅ (review) | ✅ | ✅ |
| Accept/decline a job offer | ❌ | ❌ | ❌ | 🔶 (if eligible) | ❌ | ❌ | ✅ (manual assign) | ✅ |
| Create estimate / change order | ❌ | ❌ | ❌ | 🔶 own job | ❌ | ❌ | ✅ (override) | ✅ |
| Approve/reject estimate | ❌ | 🔶 own booking | ❌ | ❌ | ❌ | ❌ | ✅ (override) | ✅ |
| View own invoices/payouts | ❌ | 🔶 | ❌ | 🔶 | 🔶 | ✅ | ✅ | ✅ |
| Message within a booking | ❌ | 🔶 own booking | ❌ | 🔶 own booking | ❌ | ✅ (support access) | ✅ | ✅ |
| Leave a review | ❌ | 🔶 completed own booking only | ❌ | ❌ | ❌ | ❌ | ❌ (moderation only) | ❌ |
| Respond to a review | ❌ | ❌ | ❌ | 🔶 own review | ❌ | ❌ | ✅ (moderate) | ✅ |
| Open a dispute/support case | ❌ | 🔶 | ❌ | 🔶 | 🔶 | ✅ (create on behalf) | ✅ | ✅ |
| Approve plumber applications | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Suspend/reactivate a user | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manually assign/reassign a plumber | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Issue a refund | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Configure commission / fees / tax / zones / matching weights | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage other admin accounts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Read audit log | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (own actions) | ✅ | ✅ |
| Write/alter audit log entries | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (append-only) | ❌ (append-only) |
| Manage feature flags / legal policy versions | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (flags) | ✅ |

Object-level rules of note:
- A customer requesting `/bookings/:id` where `booking.customerId !== session.userId` gets
  404 (not 403, to avoid leaking existence).
- A plumber requesting another plumber's documents, payouts, or messages gets 403.
- Support agents get **read** access to booking/communication history needed to handle a
  case, but cannot move money or change verification status — only Admin/Super admin can.
