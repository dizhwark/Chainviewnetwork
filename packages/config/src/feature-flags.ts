/**
 * Feature flag keys + safe defaults. Seeded into the `FeatureFlag` table;
 * overridable per-environment from the admin portal (Phase 2) or via env
 * vars for local dev (see .env.example). Every flag defaults to the state
 * specified by the product brief.
 */
export const FEATURE_FLAG_KEYS = [
  "live_gps",
  "auto_matching",
  "customer_plumber_selection",
  "subscriptions",
  "featured_placement",
  "emergency_fees",
  "tips",
  "sms",
  "masked_calling",
  "customer_refunds_credit",
  "scheduled_bookings",
  "native_push",
  "multi_zone",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  live_gps: false,
  auto_matching: false,
  customer_plumber_selection: true,
  subscriptions: false,
  featured_placement: false,
  emergency_fees: true,
  tips: false,
  sms: false,
  masked_calling: false,
  customer_refunds_credit: false,
  scheduled_bookings: true,
  native_push: false,
  multi_zone: false,
};

export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlagKey, string> = {
  live_gps: "Share plumber live GPS location with the customer during an active job.",
  auto_matching: "Automatically dispatch requests to ranked eligible plumbers instead of manual admin assignment only.",
  customer_plumber_selection: "Allow customers to browse and pick a specific plumber instead of only automatic matching.",
  subscriptions: "Enable the Plumber Pro paid subscription plan and billing.",
  featured_placement: "Enable clearly-labelled Sponsored placement in plumber ranking.",
  emergency_fees: "Apply the configured emergency/after-hours surcharge.",
  tips: "Allow customers to add an optional tip on invoices.",
  sms: "Send SMS notifications via the configured SMS provider.",
  masked_calling: "Enable masked calling between customer and plumber.",
  customer_refunds_credit: "Allow account credit as a resolution option (in addition to cash refund) on disputes.",
  scheduled_bookings: "Allow customers to schedule a booking for a future time, not just instant/emergency.",
  native_push: "Enable native mobile push notification delivery (for future React Native apps).",
  multi_zone: "Allow multiple simultaneous active service zones instead of a single launch zone.",
};
