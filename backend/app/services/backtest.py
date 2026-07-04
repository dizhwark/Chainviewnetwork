"""Backtest engine: simulate holding a sequence of replicated 13F snapshots
through time, compare against a benchmark, and compute standard performance
statistics (CAGR, volatility, Sharpe, max drawdown, alpha/beta).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

import numpy as np

from app.config import get_settings
from app.services import pricing

settings = get_settings()

TRADING_DAYS_PER_YEAR = 252


@dataclass
class RebalanceSnapshot:
    as_of: date
    weights: dict[str, float]  # ticker -> target weight, must sum to <= 1.0


@dataclass
class BacktestOutput:
    dates: list[date]
    portfolio_equity: list[float]
    benchmark_equity: list[float]
    cagr: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    alpha_annualized: float
    beta: float
    benchmark_cagr: float
    benchmark_volatility: float
    benchmark_max_drawdown: float
    warnings: list[str] = field(default_factory=list)


def _max_drawdown(equity: np.ndarray) -> float:
    running_max = np.maximum.accumulate(equity)
    drawdowns = equity / running_max - 1.0
    return float(drawdowns.min())


def _cagr(equity: np.ndarray, dates: list[date]) -> float:
    years = max((dates[-1] - dates[0]).days / 365.25, 1e-6)
    return float((equity[-1] / equity[0]) ** (1 / years) - 1)


def compute_portfolio_daily_returns(
    snapshots: list[RebalanceSnapshot],
    start_date: date,
    end_date: date,
    calendar_ticker: str,
) -> list[tuple[date, float]]:
    """Compute a daily return series for a sequence of weight snapshots, using
    calendar_ticker's trading days as the calendar. Used for factor regressions."""
    snapshots = sorted(snapshots, key=lambda s: s.as_of)
    all_tickers = sorted({t for snap in snapshots for t in snap.weights})

    price_map: dict[str, dict[date, float]] = {}
    for ticker in all_tickers:
        series = pricing.price_series_between(ticker, start_date, end_date)
        if series:
            price_map[ticker] = dict(series)

    calendar_series = pricing.price_series_between(calendar_ticker, start_date, end_date)
    calendar = [d for d, _ in calendar_series if start_date <= d <= end_date]

    returns: list[tuple[date, float]] = []
    for i in range(1, len(calendar)):
        prev_d, curr_d = calendar[i - 1], calendar[i]
        active_snapshot = None
        for snap in snapshots:
            if snap.as_of <= curr_d:
                active_snapshot = snap
            else:
                break
        if active_snapshot is None:
            active_snapshot = snapshots[0]

        leg_returns = {}
        for ticker, weight in active_snapshot.weights.items():
            series = price_map.get(ticker)
            if not series or prev_d not in series or curr_d not in series or series[prev_d] == 0:
                continue
            leg_returns[ticker] = (series[curr_d] / series[prev_d]) - 1.0

        active_weight = sum(active_snapshot.weights[t] for t in leg_returns)
        port_return = (
            sum(active_snapshot.weights[t] * leg_returns[t] for t in leg_returns) / active_weight
            if active_weight > 0
            else 0.0
        )
        returns.append((curr_d, port_return))

    return returns


def run_backtest(
    snapshots: list[RebalanceSnapshot],
    benchmark_ticker: str,
    start_date: date,
    end_date: date,
    initial_capital: float = 1_000_000.0,
    risk_free_annual: float | None = None,
) -> BacktestOutput:
    if not snapshots:
        raise ValueError("At least one holdings snapshot is required to run a backtest.")

    risk_free_annual = settings.risk_free_rate_annual if risk_free_annual is None else risk_free_annual
    risk_free_daily = (1 + risk_free_annual) ** (1 / TRADING_DAYS_PER_YEAR) - 1

    snapshots = sorted(snapshots, key=lambda s: s.as_of)
    all_tickers = sorted({t for snap in snapshots for t in snap.weights})

    warnings: list[str] = []
    price_map: dict[str, dict[date, float]] = {}
    for ticker in all_tickers:
        series = pricing.price_series_between(ticker, start_date, end_date)
        if not series:
            warnings.append(f"No price data found for {ticker}; excluded from backtest.")
            continue
        price_map[ticker] = dict(series)

    benchmark_series = pricing.price_series_between(benchmark_ticker, start_date, end_date)
    if not benchmark_series:
        raise ValueError(f"No price data available for benchmark {benchmark_ticker}.")

    calendar = [d for d, _ in benchmark_series if start_date <= d <= end_date]
    if len(calendar) < 2:
        raise ValueError("Insufficient trading days in the requested date range.")

    benchmark_price_by_date = dict(benchmark_series)

    portfolio_equity = [initial_capital]
    benchmark_equity = [initial_capital]
    portfolio_returns: list[float] = []
    benchmark_returns: list[float] = []

    for i in range(1, len(calendar)):
        prev_d, curr_d = calendar[i - 1], calendar[i]

        active_snapshot = None
        for snap in snapshots:
            if snap.as_of <= curr_d:
                active_snapshot = snap
            else:
                break
        if active_snapshot is None:
            active_snapshot = snapshots[0]

        leg_returns = {}
        for ticker, weight in active_snapshot.weights.items():
            series = price_map.get(ticker)
            if not series or prev_d not in series or curr_d not in series or series[prev_d] == 0:
                continue
            leg_returns[ticker] = (series[curr_d] / series[prev_d]) - 1.0

        active_weight = sum(active_snapshot.weights[t] for t in leg_returns)
        if active_weight > 0:
            port_return = sum(active_snapshot.weights[t] * leg_returns[t] for t in leg_returns) / active_weight
        else:
            port_return = 0.0

        bench_return = 0.0
        if prev_d in benchmark_price_by_date and curr_d in benchmark_price_by_date and benchmark_price_by_date[prev_d] != 0:
            bench_return = (benchmark_price_by_date[curr_d] / benchmark_price_by_date[prev_d]) - 1.0

        portfolio_returns.append(port_return)
        benchmark_returns.append(bench_return)
        portfolio_equity.append(portfolio_equity[-1] * (1 + port_return))
        benchmark_equity.append(benchmark_equity[-1] * (1 + bench_return))

    port_arr = np.array(portfolio_equity)
    bench_arr = np.array(benchmark_equity)
    port_ret_arr = np.array(portfolio_returns)
    bench_ret_arr = np.array(benchmark_returns)

    cagr = _cagr(port_arr, calendar)
    volatility = float(np.std(port_ret_arr, ddof=1) * np.sqrt(TRADING_DAYS_PER_YEAR)) if len(port_ret_arr) > 1 else 0.0
    mean_daily_excess = float(np.mean(port_ret_arr - risk_free_daily)) if len(port_ret_arr) else 0.0
    sharpe = (mean_daily_excess * TRADING_DAYS_PER_YEAR) / volatility if volatility > 0 else 0.0
    max_dd = _max_drawdown(port_arr)

    benchmark_cagr = _cagr(bench_arr, calendar)
    benchmark_volatility = float(np.std(bench_ret_arr, ddof=1) * np.sqrt(TRADING_DAYS_PER_YEAR)) if len(bench_ret_arr) > 1 else 0.0
    benchmark_max_dd = _max_drawdown(bench_arr)

    if len(port_ret_arr) >= 2 and np.var(bench_ret_arr) > 0:
        X = np.column_stack([np.ones(len(bench_ret_arr)), bench_ret_arr])
        coeffs, *_ = np.linalg.lstsq(X, port_ret_arr, rcond=None)
        alpha_daily, beta = float(coeffs[0]), float(coeffs[1])
    else:
        alpha_daily, beta = 0.0, 0.0
    alpha_annualized = (1 + alpha_daily) ** TRADING_DAYS_PER_YEAR - 1

    return BacktestOutput(
        dates=calendar,
        portfolio_equity=portfolio_equity,
        benchmark_equity=benchmark_equity,
        cagr=cagr,
        volatility=volatility,
        sharpe_ratio=sharpe,
        max_drawdown=max_dd,
        alpha_annualized=alpha_annualized,
        beta=beta,
        benchmark_cagr=benchmark_cagr,
        benchmark_volatility=benchmark_volatility,
        benchmark_max_drawdown=benchmark_max_dd,
        warnings=warnings,
    )
