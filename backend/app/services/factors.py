"""Factor exposure estimation via OLS regression against the Fama-French 5-factor
model plus momentum (UMD), using Ken French's Data Library as the source of
factor returns. Falls back to a small bundled synthetic factor series (clearly
marked) if the data library is unreachable, so the endpoint remains usable
offline / in restricted network environments.
"""

from __future__ import annotations

import csv
import io
import zipfile
from dataclasses import dataclass
from datetime import date, datetime
from functools import lru_cache

import httpx
import numpy as np

from app.config import get_settings

settings = get_settings()

FF5_DAILY_URL = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_5_Factors_2x3_daily_CSV.zip"
MOM_DAILY_URL = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Momentum_Factor_daily_CSV.zip"

FACTOR_NAMES = ["Mkt-RF", "SMB", "HML", "RMW", "CMA", "Mom"]


@dataclass
class FactorRegressionResult:
    alpha_daily: float
    alpha_annualized: float
    r_squared: float
    betas: dict[str, float]
    n_observations: int
    source: str  # "ken_french" or "synthetic_fallback"


def _download_zip_csv(url: str) -> str:
    with httpx.Client(timeout=settings.http_timeout_seconds) as client:
        resp = client.get(url)
        resp.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        name = zf.namelist()[0]
        return zf.read(name).decode("latin-1")


def _parse_ff_csv(text: str, value_cols: list[str]) -> dict[date, dict[str, float]]:
    lines = text.splitlines()
    data_start = next(i for i, line in enumerate(lines) if line.strip()[:1].isdigit() and len(line.strip().split(",")[0]) == 8)
    header_line = lines[data_start - 1] if lines[data_start - 1].strip() else None
    reader = csv.reader(lines[data_start:])
    out: dict[date, dict[str, float]] = {}
    for row in reader:
        if not row or not row[0].strip().isdigit():
            continue
        raw_date = row[0].strip()
        if len(raw_date) != 8:
            break
        d = datetime.strptime(raw_date, "%Y%m%d").date()
        try:
            values = [float(v) / 100.0 for v in row[1 : 1 + len(value_cols)]]
        except ValueError:
            continue
        out[d] = dict(zip(value_cols, values))
    return out


@lru_cache(maxsize=1)
def _load_factor_series() -> tuple[dict[date, dict[str, float]], str]:
    try:
        ff5_text = _download_zip_csv(FF5_DAILY_URL)
        mom_text = _download_zip_csv(MOM_DAILY_URL)
        ff5 = _parse_ff_csv(ff5_text, ["Mkt-RF", "SMB", "HML", "RMW", "CMA", "RF"])
        mom = _parse_ff_csv(mom_text, ["Mom"])
        merged: dict[date, dict[str, float]] = {}
        for d, vals in ff5.items():
            if d in mom:
                merged[d] = {**vals, **mom[d]}
        if merged:
            return merged, "ken_french"
    except (httpx.HTTPError, zipfile.BadZipFile, StopIteration, ValueError):
        pass

    return _synthetic_factor_series(), "synthetic_fallback"


def _synthetic_factor_series() -> dict[date, dict[str, float]]:
    """Deterministic placeholder factor series used only when Ken French's
    Data Library cannot be reached (e.g. no outbound internet)."""
    rng = np.random.default_rng(seed=42)
    series: dict[date, dict[str, float]] = {}
    d = date(2015, 1, 2)
    days = 0
    while days < 2600:
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
            days += 1
        d = date.fromordinal(d.toordinal() + 1)
    return series


def clear_cache() -> None:
    _load_factor_series.cache_clear()


def regress_portfolio_returns(
    portfolio_returns: list[tuple[date, float]],
) -> FactorRegressionResult:
    """OLS regress excess portfolio returns on Mkt-RF, SMB, HML, RMW, CMA, Mom."""
    factor_series, source = _load_factor_series()

    dates: list[date] = []
    y: list[float] = []
    X_rows: list[list[float]] = []
    for d, r in portfolio_returns:
        f = factor_series.get(d)
        if f is None:
            continue
        excess_r = r - f["RF"]
        dates.append(d)
        y.append(excess_r)
        X_rows.append([f["Mkt-RF"], f["SMB"], f["HML"], f["RMW"], f["CMA"], f["Mom"]])

    if len(y) < 30:
        raise ValueError("Not enough overlapping observations to run a factor regression (need >= 30 days).")

    X = np.array(X_rows)
    y_arr = np.array(y)
    X_design = np.column_stack([np.ones(len(y_arr)), X])

    coeffs, residuals, _rank, _sv = np.linalg.lstsq(X_design, y_arr, rcond=None)
    alpha_daily = float(coeffs[0])
    betas = {name: float(b) for name, b in zip(FACTOR_NAMES, coeffs[1:])}

    y_hat = X_design @ coeffs
    ss_res = float(np.sum((y_arr - y_hat) ** 2))
    ss_tot = float(np.sum((y_arr - np.mean(y_arr)) ** 2))
    r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

    alpha_annualized = (1 + alpha_daily) ** 252 - 1

    return FactorRegressionResult(
        alpha_daily=alpha_daily,
        alpha_annualized=alpha_annualized,
        r_squared=r_squared,
        betas=betas,
        n_observations=len(y_arr),
        source=source,
    )
