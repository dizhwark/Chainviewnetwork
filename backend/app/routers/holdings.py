from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Filing, Holding
from app.schemas.institution import HoldingRead

router = APIRouter(prefix="/api/filings", tags=["holdings"])


@router.get("/{filing_id}/holdings", response_model=list[HoldingRead])
def get_filing_holdings(filing_id: int, db: Session = Depends(get_db)):
    filing = db.get(Filing, filing_id)
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")

    holdings = db.scalars(
        select(Holding)
        .options(joinedload(Holding.security))
        .where(Holding.filing_id == filing_id)
        .order_by(Holding.weight.desc())
    ).all()

    return [
        HoldingRead(
            ticker=h.security.ticker,
            name=h.security.name,
            cusip=h.security.cusip,
            shares=h.shares,
            value_usd=h.value_usd,
            weight=h.weight,
        )
        for h in holdings
    ]
