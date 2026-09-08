/** Canadian market conventions. Not hard-coded to a single city — see defaults.ts
 * for the default (but admin-configurable) launch service zone. */
export const LOCALE = {
  currency: "CAD" as const,
  timezone: "America/Toronto",
  country: "CA",
  province: "ON",
  distanceUnit: "km" as const,
  dateFormat: "YYYY-MM-DD", // unambiguous, avoids MM/DD vs DD/MM confusion
  language: "en-CA",
};
