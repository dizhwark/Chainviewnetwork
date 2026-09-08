# Deferred / backlog features

These are intentionally **not built and not scaffolded** beyond this note, per the product
brief's instruction not to let them delay the functional MVP. Each includes a one-line
reason and a rough "where it would plug in" pointer for whoever picks it up later.

| Feature | Reason deferred | Future integration point |
|---|---|---|
| Loyalty rewards | Not needed to validate core marketplace loop | New `LoyaltyAccount`/`LoyaltyLedger` tables; hooks off `PAID` booking transition |
| AI recommendations | Needs usage data that doesn't exist pre-launch | Analytics events already capture the funnel data a future recommender would train on |
| Coupons | Overlaps with `Promotion` model but needs redemption limits/fraud checks | Extend `Promotion` with a `code` + `redemptionLimit`, new `PromotionRedemption` table |
| Advanced animations | Cosmetic, risks violating reduced-motion/accessibility guidance | N/A |
| Complex membership plans | Depends on validated demand post-launch | `SubscriptionPlan.type` already discriminates plan shape for this |
| Multi-trade expansion (electricians, HVAC, etc.) | Product brief is plumbing-specific for MVP | `ServiceCategory.trade` field reserved for a future trade discriminator |
| Advanced CRM | Admin portal already covers MVP operational needs | N/A |
| Kafka / event streaming | Explicitly out of scope; modular monolith is sufficient at MVP scale | Domain events are already emitted as typed in-process events (`packages/shared/src/events`) so a future outbox/Kafka bridge can subscribe without refactoring call sites |
| Microservices split | Explicitly out of scope | NestJS modules are already domain-bounded so individual modules could be extracted later |
| Demand/surge pricing | Requires careful legal/consumer-protection review before enabling | `AppSetting` pricing config is structured to add a surge multiplier later without a schema change |
| Fully automated refunds | Brief requires admin-controlled refunds, not automatic | N/A — intentionally permanent, not just deferred |
| Complex route optimization | MVP only needs straight-line/ETA estimate, not multi-stop routing | Map provider abstraction (`packages/shared` map interface) can add a routing method later |
| Native iOS/Android apps | Brief targets one PWA for MVP | Backend is a plain REST/WebSocket API with shared Zod-derived types in `packages/shared`, so a React Native client can consume it directly later |
