from app.services.replication import build_replicated_weights


def test_weights_sum_to_one():
    holdings = [
        {"cusip": "1", "ticker": "AAPL", "name": "Apple", "value_usd": 500_000},
        {"cusip": "2", "ticker": "MSFT", "name": "Microsoft", "value_usd": 300_000},
        {"cusip": "3", "ticker": "GOOG", "name": "Alphabet", "value_usd": 200_000},
    ]
    weighted = build_replicated_weights(holdings)
    assert len(weighted) == 3
    assert abs(sum(w.weight for w in weighted) - 1.0) < 1e-9
    assert weighted[0].ticker == "AAPL"
    assert weighted[0].weight == 0.5


def test_max_positions_caps_and_renormalizes():
    holdings = [
        {"cusip": str(i), "ticker": f"T{i}", "name": f"Name {i}", "value_usd": 100 - i}
        for i in range(10)
    ]
    weighted = build_replicated_weights(holdings, max_positions=3)
    assert len(weighted) == 3
    assert abs(sum(w.weight for w in weighted) - 1.0) < 1e-9
    assert [w.ticker for w in weighted] == ["T0", "T1", "T2"]


def test_min_weight_filters_and_renormalizes():
    holdings = [
        {"cusip": "1", "ticker": "BIG", "name": "Big", "value_usd": 990_000},
        {"cusip": "2", "ticker": "TINY", "name": "Tiny", "value_usd": 10_000},
    ]
    weighted = build_replicated_weights(holdings, min_weight=0.05)
    assert len(weighted) == 1
    assert weighted[0].ticker == "BIG"
    assert weighted[0].weight == 1.0


def test_empty_holdings_returns_empty():
    assert build_replicated_weights([]) == []


def test_zero_total_value_returns_empty():
    holdings = [{"cusip": "1", "ticker": "X", "name": "X", "value_usd": 0}]
    assert build_replicated_weights(holdings) == []
