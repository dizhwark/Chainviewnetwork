/**
 * All money in this codebase is an integer number of cents (CAD). Never use
 * floating-point arithmetic for currency — see product brief "Never
 * calculate money using floating-point values."
 */
export type Cents = number;

export function isValidCents(value: unknown): value is Cents {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function addCents(...values: Cents[]): Cents {
  return values.reduce((sum, v) => sum + assertCents(v), 0);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return assertCents(a) - assertCents(b);
}

/**
 * Percent-of-amount using integer math with round-half-to-even avoided in
 * favour of standard round-half-up on the fractional cent, since that's the
 * convention CRA/most POS systems use for tax rounding.
 */
export function percentOfCents(amountCents: Cents, percent: number): Cents {
  assertCents(amountCents);
  if (percent < 0) throw new Error("percent must be >= 0");
  return Math.round((amountCents * percent) / 100);
}

export function assertCents(value: number): Cents {
  if (!isValidCents(value)) {
    throw new Error(`Invalid money value: ${value} is not a non-negative integer cent amount`);
  }
  return value;
}

export function formatCadCents(cents: Cents): string {
  assertCents(cents);
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100,
  );
}
