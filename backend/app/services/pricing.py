"""Historical daily price fetching via Stooq's free CSV endpoint (no API key required)."""

from __future__ import annotations

import csv
import io
from datetime import date
from functools import lru_cache

import httpx

from app.config import get_settings

settings = get_settings()

STOOQ_URL = "https://stooq.com/q/d/l/"

_CUSIP_TO_TICKER_HINTS: dict[str, str] = {}


def register_cusip_ticker(cusip: str, ticker: str) -> None:
    _CUSIP_TO_TICKER_HINTS[cusip] = ticker


@lru_cache(maxsize=512)
def fetch_price_history(ticker: str) -> list[tuple[date, float]]:
    """Fetch full daily close-price history for a US-listed ticker from Stooq.

    Returns a list of (date, close) tuples sorted ascending by date.
    Returns an empty list if the ticker cannot be resolved (delisted, OTC, etc.).
    """
    symbol = f"{ticker.strip().lower()}.us"
    params = {"s": symbol, "i": "d"}
    try:
        with httpx.Client(timeout=settings.http_timeout_seconds) as client:
            resp = client.get(STOOQ_URL, params=params)
            resp.raise_for_status()
    except httpx.HTTPError:
        return []

    text = resp.text
    if not text or text.startswith("No data") or "Exceeded the daily hits limit" in text:
        return []

    rows: list[tuple[date, float]] = []
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        try:
            d = date.fromisoformat(row["Date"])
            close = float(row["Close"])
        except (KeyError, ValueError):
            continue
        rows.append((d, close))
    rows.sort(key=lambda r: r[0])
    return rows


def price_series_between(ticker: str, start: date, end: date) -> list[tuple[date, float]]:
    history = fetch_price_history(ticker)
    return [(d, p) for d, p in history if start <= d <= end]


def clear_cache() -> None:
    fetch_price_history.cache_clear()
