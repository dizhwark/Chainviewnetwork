from datetime import date, timedelta

import pytest

from app.services import backtest, pricing


def _make_series(start: date, days: int, daily_return: float, start_price: float = 100.0):
    series = []
    price = start_price
    d = start
    for i in range(days):
        if d.weekday() < 5:
            series.append((d, price))
            price *= 1 + daily_return
        d = d + timedelta(days=1)
    return series


@pytest.fixture
def fake_prices(monkeypatch):
    start = date(2023, 1, 2)
    fake_data = {
        "AAA": _make_series(start, 400, 0.001),
        "BBB": _make_series(start, 400, 0.0005),
        "SPY": _make_series(start, 400, 0.0003),
    }

    def fake_price_series_between(ticker, start_date, end_date):
        return [(d, p) for d, p in fake_data.get(ticker, []) if start_date <= d <= end_date]

    monkeypatch.setattr(pricing, "price_series_between", fake_price_series_between)
    return fake_data


def test_run_backtest_basic(fake_prices):
    snapshot = backtest.RebalanceSnapshot(as_of=date(2023, 1, 2), weights={"AAA": 0.6, "BBB": 0.4})
    result = backtest.run_backtest(
        [snapshot],
        benchmark_ticker="SPY",
        start_date=date(2023, 1, 2),
        end_date=date(2023, 6, 1),
        initial_capital=1_000_000.0,
    )
    assert result.portfolio_equity[0] == 1_000_000.0
    assert result.portfolio_equity[-1] > result.portfolio_equity[0]
    assert result.benchmark_equity[-1] > result.benchmark_equity[0]
    assert result.cagr > 0
    assert result.max_drawdown <= 0
    assert len(result.dates) == len(result.portfolio_equity)


def test_run_backtest_outperforms_benchmark(fake_prices):
    snapshot = backtest.RebalanceSnapshot(as_of=date(2023, 1, 2), weights={"AAA": 1.0})
    result = backtest.run_backtest(
        [snapshot],
        benchmark_ticker="SPY",
        start_date=date(2023, 1, 2),
        end_date=date(2023, 6, 1),
    )
    assert result.cagr > result.benchmark_cagr


def test_run_backtest_requires_snapshots():
    with pytest.raises(ValueError):
        backtest.run_backtest([], "SPY", date(2023, 1, 1), date(2023, 6, 1))


def test_run_backtest_missing_benchmark_raises(monkeypatch):
    monkeypatch.setattr(pricing, "price_series_between", lambda *a, **k: [])
    snapshot = backtest.RebalanceSnapshot(as_of=date(2023, 1, 2), weights={"AAA": 1.0})
    with pytest.raises(ValueError):
        backtest.run_backtest([snapshot], "SPY", date(2023, 1, 2), date(2023, 6, 1))


def test_multiple_rebalances_use_correct_snapshot(fake_prices):
    early = backtest.RebalanceSnapshot(as_of=date(2023, 1, 2), weights={"AAA": 1.0})
    later = backtest.RebalanceSnapshot(as_of=date(2023, 4, 1), weights={"BBB": 1.0})
    result = backtest.run_backtest(
        [early, later],
        benchmark_ticker="SPY",
        start_date=date(2023, 1, 2),
        end_date=date(2023, 6, 1),
    )
    assert result.portfolio_equity[-1] > 0
