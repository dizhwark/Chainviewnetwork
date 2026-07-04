"""Portfolio replication: turn raw 13F holdings into normalized target weights."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class WeightedPosition:
    cusip: str
    ticker: str | None
    name: str
    value_usd: float
    weight: float


def build_replicated_weights(
    holdings: list[dict],
    max_positions: int | None = None,
    min_weight: float = 0.0,
) -> list[WeightedPosition]:
    """Compute normalized portfolio weights from a list of raw 13F holdings.

    holdings: list of dicts with keys cusip, ticker, name, value_usd.
    max_positions: optionally cap to the top-N holdings by value (common when
        replicating a whale fund's highest-conviction bets).
    min_weight: drop positions below this weight threshold before renormalizing.
    """
    total_value = sum(h["value_usd"] for h in holdings)
    if total_value <= 0:
        return []

    positions = sorted(holdings, key=lambda h: h["value_usd"], reverse=True)
    if max_positions is not None:
        positions = positions[:max_positions]

    subtotal = sum(h["value_usd"] for h in positions)
    if subtotal <= 0:
        return []

    weighted = [
        WeightedPosition(
            cusip=h["cusip"],
            ticker=h.get("ticker"),
            name=h.get("name", ""),
            value_usd=h["value_usd"],
            weight=h["value_usd"] / subtotal,
        )
        for h in positions
    ]

    if min_weight > 0:
        weighted = [w for w in weighted if w.weight >= min_weight]
        subtotal2 = sum(w.value_usd for w in weighted)
        if subtotal2 > 0:
            for w in weighted:
                w.weight = w.value_usd / subtotal2

    return weighted
