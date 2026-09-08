import { addCents, assertCents, Cents, percentOfCents, subtractCents } from "./money";

export interface CommissionInput {
  /** Job subtotal (labour + materials), before tax and fees, in cents. */
  subtotalCents: Cents;
  /** Effective commission percent for this plumber/job (may be a founding-plumber promo rate). */
  commissionPercent: number;
}

export interface CommissionResult {
  subtotalCents: Cents;
  commissionCents: Cents;
  plumberGrossPayoutCents: Cents;
}

/** Example from product brief: $200 subtotal, 15% commission -> $30 commission, $170 to plumber. */
export function calculateCommission({ subtotalCents, commissionPercent }: CommissionInput): CommissionResult {
  assertCents(subtotalCents);
  if (commissionPercent < 0 || commissionPercent > 100) {
    throw new Error("commissionPercent out of range");
  }
  const commissionCents = percentOfCents(subtotalCents, commissionPercent);
  return {
    subtotalCents,
    commissionCents,
    plumberGrossPayoutCents: subtractCents(subtotalCents, commissionCents),
  };
}

export interface EmergencyFeeConfig {
  enabled: boolean;
  type: "fixed_cents" | "percent";
  amountCents: number;
  percent: number;
}

export function calculateEmergencyFee(subtotalCents: Cents, config: EmergencyFeeConfig, isEmergency: boolean): Cents {
  if (!isEmergency || !config.enabled) return 0;
  return config.type === "fixed_cents" ? config.amountCents : percentOfCents(subtotalCents, config.percent);
}

export interface InvoiceTotals {
  subtotalCents: Cents;
  emergencyFeeCents: Cents;
  discountCents: Cents;
  taxableBaseCents: Cents;
  hstCents: Cents;
  totalCents: Cents;
  commissionCents: Cents;
  plumberGrossPayoutCents: Cents;
}

export interface InvoiceCalcInput {
  subtotalCents: Cents;
  discountCents?: Cents;
  hstPercent: number;
  commissionPercent: number;
  emergency: {
    isEmergency: boolean;
    config: EmergencyFeeConfig;
  };
}

/**
 * Single authoritative calculation used by both the estimate preview and the
 * final invoice, so a customer never sees a total that the backend can't
 * reproduce exactly. All intermediate values are integer cents.
 */
export function calculateInvoiceTotals(input: InvoiceCalcInput): InvoiceTotals {
  const subtotalCents = assertCents(input.subtotalCents);
  const discountCents = assertCents(input.discountCents ?? 0);
  if (discountCents > subtotalCents) throw new Error("discount cannot exceed subtotal");

  const emergencyFeeCents = calculateEmergencyFee(
    subtotalCents,
    input.emergency.config,
    input.emergency.isEmergency,
  );

  const taxableBaseCents = subtractCents(addCents(subtotalCents, emergencyFeeCents), discountCents);
  const hstCents = percentOfCents(taxableBaseCents, input.hstPercent);
  const totalCents = addCents(taxableBaseCents, hstCents);

  const { commissionCents, plumberGrossPayoutCents } = calculateCommission({
    subtotalCents,
    commissionPercent: input.commissionPercent,
  });

  return {
    subtotalCents,
    emergencyFeeCents,
    discountCents,
    taxableBaseCents,
    hstCents,
    totalCents,
    commissionCents,
    plumberGrossPayoutCents,
  };
}
