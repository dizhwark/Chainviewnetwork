# Items requiring professional review

This codebase implements reasonable defaults and clearly-labelled placeholders. **None of
it constitutes legal, tax, insurance, or accounting advice, and none of it should be
described to end users as compliant with any law until reviewed by a qualified
professional.** Do not remove this document or the "placeholder"/"template" labels in the
UI without that review.

## Needs an Ontario lawyer

- Terms of Service, Privacy Policy, Cancellation Policy, Refund & Dispute Policy — shipped
  as clearly-labelled **templates** (`apps/web` legal pages), not final legal text.
- Contractor/provider agreement between MAYBE and plumbers — shipped as a placeholder page
  only; do not let a plumber "accept" a binding agreement until real counsel drafts it.
- Classification of plumbers as independent contractors vs. employees under Ontario
  employment law, given the degree of control the matching/dispatch system exerts.
- Consumer protection compliance (Ontario *Consumer Protection Act, 2002*) for the
  estimate-approval and cancellation flows, and for how the emergency-fee disclosure is
  presented before payment authorization.
- Marketplace liability language: what MAYBE claims/disclaims about work quality, given
  the in-app "shut off water / call 911" emergency disclaimer.

## Needs a privacy professional (PIPEDA-aligned, not certified compliant)

- Data retention periods per table (drafted as configurable `AppSetting` values with
  documented defaults in `docs/privacy-model.md`-equivalent comments in the Prisma schema,
  but the actual retention windows are business/legal decisions).
- Location-data minimization: the brief requires this by design (`LocationEvent` only
  exists for active jobs, TTL-purged) — a privacy professional should confirm the retention
  window is sufficient-but-minimal for safety/dispute needs.
- Cross-border data processing if any vendor (Stripe, map provider, email/SMS provider,
  hosting) stores data outside Canada.
- Consent language for analytics/marketing vs. essential service notifications (built as
  two separate preference groups, but wording needs review).

## Needs an accountant

- HST treatment of labour vs. materials, out-of-province customers, and whether the
  platform commission itself is taxable — the code applies a single configurable HST rate
  to the invoice subtotal as a starting default (13%) and this **must** be reviewed.
- Whether plumbers' HST registration numbers must be captured/validated before invoicing
  (a field exists on `PlumberProfile` but no validation logic is implemented).
- 1099/T4A-equivalent reporting obligations for plumber payouts.

## Needs an insurance adviser

- Minimum required commercial general liability coverage amount to gate job acceptance
  (currently just captured as a number with an expiry date, no minimum enforced).
- Whether MAYBE itself needs platform/marketplace liability insurance.
- How emergency/urgent dispatch (water/gas hazards) affects the platform's own liability
  exposure, informing the wording of the in-app safety disclaimer.

## Operational decisions recorded as defaults (not blocking, but worth revisiting)

- Commission default 15%, range 0–20%, configurable by admin without a deploy.
- Cancellation-fee windows are stored as configurable `AppSetting` values with no fee
  applied by default until an admin sets one.
- Auto-confirm window for "customer confirms completion" defaults to 24 hours before the
  system proceeds to payment capture — this should be reviewed against consumer-protection
  norms.
