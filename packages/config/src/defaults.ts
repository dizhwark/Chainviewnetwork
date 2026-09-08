/**
 * Business-rule DEFAULTS. These seed the `AppSetting` table on first run;
 * after that, administrators change them from the admin portal without a
 * deploy. Nothing that reads live business rules should import these
 * directly outside of the seed script — read from `AppSetting` instead so
 * a single deploy can serve multiple differently-configured environments.
 */

export const PLATFORM_DEFAULTS = {
  /** Percent (0-20 allowed) taken as platform commission on a completed job. */
  commissionPercent: 15,
  commissionPercentMin: 0,
  commissionPercentMax: 20,

  /** Ontario HST default — MUST be reviewed by an accountant, see docs/legal-and-professional-review.md */
  hstPercent: 13,

  /** Emergency / after-hours surcharge. Type is "fixed_cents" or "percent". */
  emergencyFee: {
    type: "fixed_cents" as "fixed_cents" | "percent",
    amountCents: 5_000, // CAD $50.00 placeholder
    percent: 10,
    enabled: true,
  },

  /** Plumber Pro subscription placeholder price. */
  proSubscriptionPriceCents: 4_900, // CAD $49.00/month

  /** Founding-plumber promotional window, in days, offered at admin's discretion. */
  foundingPlumberWindowDays: 90,

  /** Dispatch defaults. */
  dispatch: {
    initialBatchSize: 3,
    acceptanceWindowSeconds: 90,
    radiusExpansionKm: [5, 10, 15, 25],
  },

  /** Matching ranking weights — must sum to 100; see packages/shared/src/matching. */
  matchingWeights: {
    etaMinutes: 20,
    distanceKm: 15,
    rating: 15,
    reviewCount: 5,
    acceptanceRate: 10,
    cancellationRate: 10,
    responseTime: 10,
    repeatCustomer: 10,
    sponsoredBoost: 5,
  },

  /** Booking auto-confirm window before payment capture proceeds without customer action. */
  completionAutoConfirmHours: 24,

  /** Default launch service zone. Configurable — this is a seed default, not a hard-code. */
  launchServiceZone: {
    name: "Downtown Toronto",
    province: "ON",
    postalPrefixes: ["M4", "M5", "M6", "M7"],
    centerLat: 43.6532,
    centerLng: -79.3832,
    radiusKm: 12,
  },
} as const;
