import { describe, expect, it } from "vitest";
import { CandidatePlumber, MatchingWeights, rankCandidates } from "../matching/rank";

const weights: MatchingWeights = {
  etaMinutes: 20,
  distanceKm: 15,
  rating: 15,
  reviewCount: 5,
  acceptanceRate: 10,
  cancellationRate: 10,
  responseTime: 10,
  repeatCustomer: 10,
  sponsoredBoost: 5,
};

function candidate(overrides: Partial<CandidatePlumber>): CandidatePlumber {
  return {
    plumberId: "p1",
    etaMinutes: 20,
    distanceKm: 5,
    averageRating: 4.5,
    reviewCount: 20,
    acceptanceRatePercent: 90,
    cancellationRatePercent: 5,
    avgResponseSeconds: 60,
    isRepeatCustomerPreferred: false,
    isSponsored: false,
    ...overrides,
  };
}

describe("rankCandidates", () => {
  it("ranks a closer, faster, better-rated plumber above a worse one", () => {
    const good = candidate({ plumberId: "good" });
    const bad = candidate({
      plumberId: "bad",
      etaMinutes: 55,
      distanceKm: 24,
      averageRating: 2.5,
      acceptanceRatePercent: 40,
      cancellationRatePercent: 40,
    });
    const [first] = rankCandidates([bad, good], weights);
    expect(first.plumberId).toBe("good");
  });

  it("gives sponsored placement only a small boost that cannot overcome a large quality gap", () => {
    const sponsoredButWorse = candidate({
      plumberId: "sponsored",
      isSponsored: true,
      averageRating: 2.0,
      acceptanceRatePercent: 30,
      cancellationRatePercent: 50,
    });
    const organicBetter = candidate({ plumberId: "organic", isSponsored: false });
    const [first] = rankCandidates([sponsoredButWorse, organicBetter], weights);
    expect(first.plumberId).toBe("organic");
  });

  it("lets a sponsored boost break a near-tie", () => {
    const sponsored = candidate({ plumberId: "sponsored", isSponsored: true });
    const identicalNotSponsored = candidate({ plumberId: "twin", isSponsored: false });
    const [first] = rankCandidates([identicalNotSponsored, sponsored], weights);
    expect(first.plumberId).toBe("sponsored");
  });

  it("throws if all weights are zero", () => {
    const zeroWeights: MatchingWeights = {
      etaMinutes: 0,
      distanceKm: 0,
      rating: 0,
      reviewCount: 0,
      acceptanceRate: 0,
      cancellationRate: 0,
      responseTime: 0,
      repeatCustomer: 0,
      sponsoredBoost: 0,
    };
    expect(() => rankCandidates([candidate({})], zeroWeights)).toThrow();
  });
});
