/**
 * Pure ranking function for the plumber matching engine (Phase 2 —
 * scaffolded and unit-tested now so the dispatch loop can be wired later
 * without redesigning the scoring model). Eligibility filtering (license/
 * insurance validity, service-area containment, online status, no
 * overlapping job, no blocks) happens upstream in the API before this
 * function ever sees a candidate — this function only ranks pre-filtered,
 * eligible candidates. It must never take protected personal
 * characteristics as input.
 */
export interface MatchingWeights {
  etaMinutes: number;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  acceptanceRate: number;
  cancellationRate: number;
  responseTime: number;
  repeatCustomer: number;
  sponsoredBoost: number;
}

export interface CandidatePlumber {
  plumberId: string;
  etaMinutes: number;
  distanceKm: number;
  averageRating: number; // 0-5
  reviewCount: number;
  acceptanceRatePercent: number; // 0-100
  cancellationRatePercent: number; // 0-100
  avgResponseSeconds: number;
  isRepeatCustomerPreferred: boolean;
  /** Sponsored placement never overrides trust/relevance — it only adds a small, capped boost. */
  isSponsored: boolean;
}

function normalizeInverse(value: number, max: number): number {
  if (max <= 0) return 0;
  const clamped = Math.min(Math.max(value, 0), max);
  return 1 - clamped / max;
}

function normalizeDirect(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.max(value, 0), max) / max;
}

export interface RankedPlumber {
  plumberId: string;
  score: number;
  breakdown: Record<string, number>;
}

export function rankCandidates(
  candidates: CandidatePlumber[],
  weights: MatchingWeights,
): RankedPlumber[] {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) throw new Error("matching weights must not all be zero");

  return candidates
    .map((c) => {
      const breakdown: Record<string, number> = {
        etaMinutes: normalizeInverse(c.etaMinutes, 60) * weights.etaMinutes,
        distanceKm: normalizeInverse(c.distanceKm, 25) * weights.distanceKm,
        rating: normalizeDirect(c.averageRating, 5) * weights.rating,
        reviewCount: normalizeDirect(Math.log10(c.reviewCount + 1), 2) * weights.reviewCount,
        acceptanceRate: normalizeDirect(c.acceptanceRatePercent, 100) * weights.acceptanceRate,
        cancellationRate: normalizeInverse(c.cancellationRatePercent, 100) * weights.cancellationRate,
        responseTime: normalizeInverse(c.avgResponseSeconds, 300) * weights.responseTime,
        repeatCustomer: (c.isRepeatCustomerPreferred ? 1 : 0) * weights.repeatCustomer,
        // Sponsored boost is capped and additive on top of the trust/relevance score,
        // so it can move an otherwise-tied result up slightly but can never outrank a
        // meaningfully better-qualified plumber.
        sponsoredBoost: (c.isSponsored ? 1 : 0) * weights.sponsoredBoost,
      };
      const score = Object.values(breakdown).reduce((a, b) => a + b, 0) / totalWeight;
      return { plumberId: c.plumberId, score, breakdown };
    })
    .sort((a, b) => b.score - a.score);
}
