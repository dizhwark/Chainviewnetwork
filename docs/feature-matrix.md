# MVP feature matrix

Legend: **Built** = working end-to-end this session · **Scaffolded** = data model / module
skeleton exists, business logic not implemented · **Backlog** = documented only, see
`backlog-deferred-features.md`.

| Area | Feature | Status | Notes |
|---|---|---|---|
| Public site | Home, How it works, Services, Emergency, Browse plumbers, Plumber profile, Become a plumber, Pricing, Trust & safety, FAQ, Contact, Legal pages, Sign in, Sign up | **Built** | Static content pages + real data where noted (browse plumbers reads seeded/approved plumbers) |
| Coverage check | Postal-code / address zone check | **Built** | Backed by real `ServiceZone` records |
| Customer request | Address, problem, urgency, photos, contact | **Built** | Writes `ServiceRequest` row, triggers analytics + notification (console/email adapter) |
| Plumber application | Full onboarding form incl. license/insurance upload | **Built** | Writes `PlumberApplication`, uploads to S3-compatible storage via signed URL |
| Admin auth | Email/password + session, MFA hook | **Built** (MFA scaffolded) | TOTP field on `User`, enforcement flag documented for production |
| Admin dashboard | Request queue, funnel counts, manual assignment, status updates | **Built** | |
| Manual dispatch | Admin assigns/reassigns a plumber to a request | **Built** | |
| Payment link | Stripe Checkout/payment link per request | **Built (dev-mock fallback)** | Real Stripe Checkout Session in test mode when `STRIPE_SECRET_KEY` set, else mock link + console log |
| Manual invoice | Admin records line items, totals, tax | **Built** | Feeds `Invoice`/`InvoiceLineItem` tables |
| Reviews | Post-completion review collection | **Built** | Public review submission via signed link |
| Analytics | Funnel + operational events | **Built** | `AnalyticsEvent` table + typed event helper |
| Full customer auth | Signup, email/phone verification, password reset, OAuth | **Scaffolded** | `User`, `UserSession`, provider columns exist; endpoints for password auth built, OAuth not wired (no credentials) |
| Booking state machine | Full 25-state machine | **Scaffolded** | Implemented as pure TS module + DB columns; only the Phase-1 subset of statuses is driven end-to-end |
| Automatic matching | Ranked, eligible plumber matching + dispatch batches | **Scaffolded** | Data model + pure ranking function with unit tests; not wired to a live dispatch loop |
| Estimates / change orders | Itemized estimate builder, customer approval, versioning | **Scaffolded** | Full schema incl. immutable version history; UI not built |
| Stripe Connect onboarding | Plumber payout accounts | **Scaffolded** | `PlumberPayoutAccount` model + documented onboarding flow; requires live Stripe Connect platform account to test fully |
| Live location tracking | WebSocket location sharing | **Scaffolded** | `LocationEvent` model + retention policy documented; gateway not implemented |
| In-app messaging | Booking-scoped chat | **Scaffolded** | `Message`/`MessageAttachment` model; UI not built |
| Notifications | In-app/email/push/SMS | **Partially built** | Email (console/SMTP adapter) used for Phase 1 events; in-app/push/SMS scaffolded |
| Disputes & refunds | Evidence, admin decision, partial/full refund | **Scaffolded** | `Dispute`, `Refund` models + admin refund action stub with full audit log entry; guided workflow UI not built |
| Subscriptions | Plumber Pro plan | **Scaffolded**, flagged off | `Subscription`, `SubscriptionPlan` models |
| Sponsored placement | "Sponsored" labelled ranking boost | **Scaffolded**, flagged off | Ranking weight documented, never overrides trust factors |
| Admin audit log | Append-only sensitive-action log | **Built** | Every admin mutation in Phase 1 (assign, refund stub, application decision) writes an `AuditLog` row |
| Feature flags | Central on/off switches | **Built** | `FeatureFlag` table + typed accessor, seeded with the spec's flag list, all future-facing flags default OFF |

Everything under "Delay these features" in the product brief (loyalty, AI recommendations,
coupons, advanced animation, complex memberships, multi-trade, advanced CRM, Kafka/
microservices, surge pricing, automated refunds, route optimization, native apps) is
**not built and not scaffolded** beyond a backlog entry, per instruction.
