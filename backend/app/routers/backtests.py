from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import BacktestResult, Filing, Holding, Institution
from app.schemas.backtest import BacktestRead, BacktestRequest
from app.services import backtest as backtest_service
from app.services import replication

router = APIRouter(prefix="/api/institutions", tags=["backtests"])


def _snapshot_from_filing(db: Session, filing: Filing, max_positions: int = 50) -> backtest_service.RebalanceSnapshot | None:
    holdings = db.scalars(
        select(Holding).options(joinedload(Holding.security)).where(Holding.filing_id == filing.id)
    ).all()
    raw = [
        {"cusip": h.security.cusip, "ticker": h.security.ticker, "name": h.security.name, "value_usd": h.value_usd}
        for h in holdings
        if h.security.ticker
    ]
    weighted = replication.build_replicated_weights(raw, max_positions=max_positions)
    if not weighted:
        return None
    return backtest_service.RebalanceSnapshot(
        as_of=filing.period_of_report, weights={w.ticker: w.weight for w in weighted}
    )


@router.post("/{institution_id}/backtest", response_model=BacktestRead)
def run_backtest(institution_id: int, request: BacktestRequest, db: Session = Depends(get_db)):
    institution = db.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    filings = db.scalars(
        select(Filing)
        .where(Filing.institution_id == institution_id)
        .order_by(Filing.period_of_report.asc())
    ).all()
    if not filings:
        raise HTTPException(status_code=400, detail="No filings synced for this institution yet.")

    snapshots = []
    for filing in filings:
        snap = _snapshot_from_filing(db, filing)
        if snap:
            snapshots.append(snap)
    if not snapshots:
        raise HTTPException(status_code=400, detail="No holdings with resolvable tickers to backtest.")

    end_date = request.end_date or date.today()
    start_date = request.start_date or (filings[0].period_of_report)
    if start_date >= end_date:
        start_date = end_date - timedelta(days=365)

    try:
        result = backtest_service.run_backtest(
            snapshots,
            benchmark_ticker=request.benchmark_ticker,
            start_date=start_date,
            end_date=end_date,
            initial_capital=request.initial_capital,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    record = BacktestResult(
        institution_id=institution.id,
        benchmark_ticker=request.benchmark_ticker,
        start_date=result.dates[0],
        end_date=result.dates[-1],
        rebalance_frequency=request.rebalance_frequency,
        cagr=result.cagr,
        volatility=result.volatility,
        sharpe_ratio=result.sharpe_ratio,
        max_drawdown=result.max_drawdown,
        alpha_annualized=result.alpha_annualized,
        beta=result.beta,
        benchmark_cagr=result.benchmark_cagr,
        benchmark_volatility=result.benchmark_volatility,
        benchmark_max_drawdown=result.benchmark_max_drawdown,
        equity_curve=[{"date": d.isoformat(), "value": v} for d, v in zip(result.dates, result.portfolio_equity)],
        benchmark_curve=[{"date": d.isoformat(), "value": v} for d, v in zip(result.dates, result.benchmark_equity)],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{institution_id}/backtest", response_model=list[BacktestRead])
def list_backtests(institution_id: int, db: Session = Depends(get_db)):
    return db.scalars(
        select(BacktestResult)
        .where(BacktestResult.institution_id == institution_id)
        .order_by(BacktestResult.created_at.desc())
    ).all()
