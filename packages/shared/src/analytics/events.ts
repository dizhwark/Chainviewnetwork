/**
 * Typed analytics event catalogue covering the customer + plumber funnels
 * and operational metrics defined in the product brief. Event properties
 * must never contain raw addresses, payment details, or free-text problem
 * descriptions — pass IDs/categories instead, enforced by the type below.
 */
export const ANALYTICS_EVENTS = [
  // Customer funnel
  "landing_page_visit",
  "address_submitted",
  "service_selected",
  "booking_started",
  "payment_method_added",
  "request_submitted",
  "plumber_matched",
  "booking_accepted",
  "job_completed",
  "payment_completed",
  "review_submitted",
  // Plumber funnel
  "recruitment_page_visit",
  "application_started",
  "application_submitted",
  "application_approved",
  "first_time_online",
  "first_request_received",
  "first_request_accepted",
  "first_job_completed",
  "first_payout",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Allow-listed property keys — anything else is stripped before storage/emit. */
export const ANALYTICS_SAFE_PROPERTY_KEYS = [
  "categorySlug",
  "serviceZoneId",
  "urgency",
  "source",
  "isDemoData",
  "plumberProfileId",
  "serviceRequestId",
  "bookingId",
  "amountBucket", // e.g. "0-50", "50-150" — never a raw dollar amount tied to a person
] as const;

export type AnalyticsProperties = Partial<Record<(typeof ANALYTICS_SAFE_PROPERTY_KEYS)[number], string | boolean>>;

export function sanitizeAnalyticsProperties(input: Record<string, unknown>): AnalyticsProperties {
  const out: AnalyticsProperties = {};
  for (const key of ANALYTICS_SAFE_PROPERTY_KEYS) {
    if (key in input) {
      const value = input[key];
      if (typeof value === "string" || typeof value === "boolean") {
        (out as Record<string, string | boolean>)[key] = value;
      }
    }
  }
  return out;
}
