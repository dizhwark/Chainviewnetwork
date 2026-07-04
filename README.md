# ChainView — Institutional Portfolio Replication Engine

Recreate hedge fund / institutional portfolios from SEC 13F-HR filings, estimate
factor exposures against the Fama-French 5-factor + momentum model, backtest the
replicated portfolio through time, and compare it against a benchmark ETF.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Alembic
- **Frontend:** React, TypeScript, Vite, Recharts
- **Data sources:** SEC EDGAR (13F-HR filings), Stooq (daily prices, no API key), Ken French Data Library (factor returns)
- **Infra:** Docker Compose

## How it works

1. **Search & sync** — Search EDGAR for a 13F filer by name, then sync its most
   recent 13F-HR filings. Each filing's information table (issuer, CUSIP,
   shares, market value) is parsed and persisted.
2. **Replication** (`app/services/replication.py`) — Raw dollar holdings are
   turned into normalized target weights, optionally capped to the top-N
   positions (conviction replication) or filtered by a minimum weight.
3. **Factor exposure** (`app/services/factors.py`) — The replicated portfolio's
   historical daily returns (using Stooq price history for each holding) are
   regressed via OLS against Mkt-RF, SMB, HML, RMW, CMA, and Momentum to
   produce annualized alpha, R², and factor betas.
4. **Backtest** (`app/services/backtest.py`) — Chains every synced filing as a
   quarterly rebalance snapshot, marks the portfolio to market daily using
   Stooq price history, and computes CAGR, volatility, Sharpe ratio, max
   drawdown, and CAPM alpha/beta versus a chosen benchmark ETF (SPY, QQQ, IWM,
   DIA).

If Stooq/Ken French are unreachable (e.g. no outbound internet), the factor
regression falls back to a clearly-labeled synthetic factor series so the API
stays usable in offline/sandboxed environments — production deployments with
internet access will use live data automatically.

## Running locally

```bash
cp .env.example .env
docker compose up --build
```

- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:4173

### Without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## API overview

| Method | Path | Description |
|---|---|---|
| GET | `/api/institutions/search?q=` | Search EDGAR for 13F filers by name |
| POST | `/api/institutions/{cik}/sync` | Pull & persist recent 13F-HR filings + holdings |
| GET | `/api/institutions/{id}` | Institution detail with filing history |
| GET | `/api/filings/{filing_id}/holdings` | Replicated weights for one filing |
| POST | `/api/institutions/{id}/factor-exposure` | Run FF5+Momentum regression |
| POST | `/api/institutions/{id}/backtest` | Run the backtest vs. a benchmark |

## Tests

```bash
cd backend
pytest
```

Unit tests cover portfolio replication, the backtest engine, and the factor
regression using synthetic price/factor data (no network or database required).
