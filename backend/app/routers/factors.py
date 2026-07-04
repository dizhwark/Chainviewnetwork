from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.database import get_db
from app.models import Filing, FactorExposure, Holding, Institution
from app.schemas.factor import FactorExposureRead
from app.services import backtest, factors, replication

router = APIRouter(prefix="/api/institutions", tags=["factors"])
settings = get_settings()


@router.post("/{institution_id}/factor-exposure", response_model=FactorExposureRead)
def compute_factor_exposure(institution_id: int, lookback_years: int = 3, db: Session = Depends(get_db)):
    institution = db.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    latest_filing = db.scalar(
        select(Filing)
        .where(Filing.institution_id == institution_id)
        .order_by(Filing.period_of_report.desc())
    )
    if not latest_filing:
        raise HTTPException(status_code=400, detail="No filings synced for this institution yet.")

    holdings = db.scalars(
        select(Holding).options(joinedload(Holding.security)).where(Holding.filing_id == latest_filing.id)
    ).all()
    raw = [
        {"cusip": h.security.cusip, "ticker": h.security.ticker, "name": h.security.name, "value_usd": h.value_usd}
        for h in holdings
        if h.security.ticker
    ]
    weighted = replication.build_replicated_weights(raw, max_positions=50)
    if not weighted:
        raise HTTPException(status_code=400, detail="No holdings with resolvable tickers to analyze.")

    weights = {w.ticker: w.weight for w in weighted}
    end_date = date.today()
    start_date = end_date - timedelta(days=365 * lookback_years)

    snapshot = backtest.RebalanceSnapshot(as_of=latest_filing.period_of_report, weights=weights)
    try:
        port_returns = backtest.compute_portfolio_daily_returns(
            [snapshot], start_date, end_date, calendar_ticker=settings.default_benchmark_ticker
        )
        result = factors.regress_portfolio_returns(port_returns)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    exposure = FactorExposure(
        institution_id=institution.id,
        as_of_date=end_date,
        model_name="FF5+MOM",
        alpha_annualized=result.alpha_annualized,
        r_squared=result.r_squared,
        mkt_rf_beta=result.betas["Mkt-RF"],
        smb_beta=result.betas["SMB"],
        hml_beta=result.betas["HML"],
        rmw_beta=result.betas["RMW"],
        cma_beta=result.betas["CMA"],
        mom_beta=result.betas["Mom"],
    )
    db.add(exposure)
    db.commit()
    db.refresh(exposure)
    return exposure


@router.get("/{institution_id}/factor-exposure", response_model=list[FactorExposureRead])
def list_factor_exposures(institution_id: int, db: Session = Depends(get_db)):
    return db.scalars(
        select(FactorExposure)
        .where(FactorExposure.institution_id == institution_id)
        .order_by(FactorExposure.created_at.desc())
    ).all()
