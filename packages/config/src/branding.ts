/**
 * SINGLE SOURCE OF TRUTH for the product name and brand strings.
 *
 * The product is currently called "MAYBE" as a working name and may be
 * renamed later. To rename the product, change BRAND.name below (and,
 * optionally, PRODUCT_NAME / NEXT_PUBLIC_PRODUCT_NAME in the environment to
 * override it without a rebuild). Nothing else in the codebase should hard-
 * code the product name — always import BRAND from this file.
 */

export interface Brand {
  /** Display name used everywhere in the customer/plumber/admin UI. */
  name: string;
  /** Short legal/trade name used in invoices, receipts, and legal pages. */
  legalName: string;
  /** Lowercase, URL/handle-safe slug derived from the name unless overridden. */
  slug: string;
  /** One-line tagline for marketing surfaces. */
  tagline: string;
  /** Support contact surfaced on public pages (placeholder — replace with real values). */
  supportEmail: string;
  supportPhoneDisplay: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const name = process.env.PRODUCT_NAME || process.env.NEXT_PUBLIC_PRODUCT_NAME || "MAYBE";

export const BRAND: Brand = {
  name,
  legalName: `${name} Technologies Inc. (placeholder — confirm registered legal entity name)`,
  slug: slugify(name),
  tagline: "Verified plumbers, transparent pricing, on your schedule.",
  supportEmail: "support@maybe.example",
  supportPhoneDisplay: "(416) 555-0100",
};

/** Words banned from customer-facing copy per product policy — used by lint/test checks. */
export const BANNED_CUSTOMER_FACING_TERMS = [
  "PlumbLink",
  "Uber",
  "driver",
  "ride",
  "trip",
  "rider",
  "fare",
] as const;
