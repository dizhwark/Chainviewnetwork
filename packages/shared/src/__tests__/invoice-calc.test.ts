import { describe, expect, it } from "vitest";
import { calculateCommission, calculateInvoiceTotals } from "../pricing/invoice-calc";

describe("calculateCommission", () => {
  it("matches the product brief example: $200 subtotal, 15% commission", () => {
    const result = calculateCommission({ subtotalCents: 20_000, commissionPercent: 15 });
    expect(result.commissionCents).toBe(3_000);
    expect(result.plumberGrossPayoutCents).toBe(17_000);
  });

  it("rejects out-of-range commission percent", () => {
    expect(() => calculateCommission({ subtotalCents: 100, commissionPercent: 101 })).toThrow();
    expect(() => calculateCommission({ subtotalCents: 100, commissionPercent: -1 })).toThrow();
  });
});

describe("calculateInvoiceTotals", () => {
  const baseEmergencyConfig = { enabled: true, type: "fixed_cents" as const, amountCents: 5_000, percent: 10 };

  it("computes HST on subtotal + emergency fee - discount, with integer cents only", () => {
    const totals = calculateInvoiceTotals({
      subtotalCents: 20_000,
      hstPercent: 13,
      commissionPercent: 15,
      emergency: { isEmergency: false, config: baseEmergencyConfig },
    });
    expect(totals.taxableBaseCents).toBe(20_000);
    expect(totals.hstCents).toBe(2_600);
    expect(totals.totalCents).toBe(22_600);
    expect(Number.isInteger(totals.totalCents)).toBe(true);
  });

  it("applies a fixed emergency fee before tax when isEmergency is true", () => {
    const totals = calculateInvoiceTotals({
      subtotalCents: 20_000,
      hstPercent: 13,
      commissionPercent: 15,
      emergency: { isEmergency: true, config: baseEmergencyConfig },
    });
    expect(totals.emergencyFeeCents).toBe(5_000);
    expect(totals.taxableBaseCents).toBe(25_000);
    expect(totals.hstCents).toBe(3_250);
  });

  it("does not apply the emergency fee if the flag is disabled", () => {
    const totals = calculateInvoiceTotals({
      subtotalCents: 20_000,
      hstPercent: 13,
      commissionPercent: 15,
      emergency: { isEmergency: true, config: { ...baseEmergencyConfig, enabled: false } },
    });
    expect(totals.emergencyFeeCents).toBe(0);
  });

  it("applies a discount before tax and rejects a discount larger than the subtotal", () => {
    const totals = calculateInvoiceTotals({
      subtotalCents: 10_000,
      discountCents: 2_000,
      hstPercent: 13,
      commissionPercent: 15,
      emergency: { isEmergency: false, config: baseEmergencyConfig },
    });
    expect(totals.taxableBaseCents).toBe(8_000);

    expect(() =>
      calculateInvoiceTotals({
        subtotalCents: 1_000,
        discountCents: 2_000,
        hstPercent: 13,
        commissionPercent: 15,
        emergency: { isEmergency: false, config: baseEmergencyConfig },
      }),
    ).toThrow();
  });
});
