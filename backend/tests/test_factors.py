from datetime import date, timedelta

import numpy as np
import pytest

from app.services import factors


def _make_factor_series(days: int, seed: int = 1):
    rng = np.random.default_rng(seed)
    series = {}
    d = date(2022, 1, 3)
    count = 0
    while count < days:
        if d.weekday() < 5:
            series[d] = {
                "Mkt-RF": float(rng.normal(0.0004, 0.008)),
                "SMB": float(rng.normal(0.0, 0.003)),
                "HML": float(rng.normal(0.0, 0.003)),
                "RMW": float(rng.normal(0.0, 0.0025)),
                "CMA": float(rng.normal(0.0, 0.0025)),
                "Mom": float(rng.normal(0.0, 0.004)),
                "RF": 0.00008,
            }
            count += 1
        d += timedelta(days=1)
    return series


@pytest.fixture(autouse=True)
def patch_factor_series(monkeypatch):
    factors.clear_cache()
    series = _make_factor_series(300)
    monkeypatch.setattr(factors, "_load_factor_series", lambda: (series, "test_fixture"))
    yield


def test_regression_recovers_known_beta():
    series, _ = factors._load_factor_series()
    dates = sorted(series.keys())
    true_beta = 1.5
    true_alpha_daily = 0.0002
    portfolio_returns = []
    for d in dates:
        f = series[d]
        r = true_alpha_daily + f["RF"] + true_beta * f["Mkt-RF"]
        portfolio_returns.append((d, r))

    result = factors.regress_portfolio_returns(portfolio_returns)
    assert result.betas["Mkt-RF"] == pytest.approx(true_beta, abs=0.05)
    assert result.r_squared > 0.9
    assert result.n_observations == len(dates)


def test_regression_requires_minimum_observations():
    series, _ = factors._load_factor_series()
    dates = sorted(series.keys())[:10]
    portfolio_returns = [(d, 0.001) for d in dates]
    with pytest.raises(ValueError):
        factors.regress_portfolio_returns(portfolio_returns)


def test_regression_ignores_non_overlapping_dates():
    series, _ = factors._load_factor_series()
    dates = sorted(series.keys())
    portfolio_returns = [(d, 0.0005) for d in dates] + [
        (date(2099, 1, 1), 0.5) for _ in range(5)
    ]
    result = factors.regress_portfolio_returns(portfolio_returns)
    assert result.n_observations == len(dates)
