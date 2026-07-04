"""Orchestrates pulling data from SEC EDGAR and persisting it via SQLAlchemy."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Filing, Holding, Institution, Security
from app.services import edgar_client


def get_or_create_institution(db: Session, cik: str, name: str) -> Institution:
    cik = edgar_client.normalize_cik(cik)
    institution = db.scalar(select(Institution).where(Institution.cik == cik))
    if institution:
        return institution
    institution = Institution(cik=cik, name=name)
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution


def get_or_create_security(db: Session, cusip: str, name: str, ticker: str | None = None) -> Security:
    security = db.scalar(select(Security).where(Security.cusip == cusip))
    if security:
        if ticker and not security.ticker:
            security.ticker = ticker
            db.commit()
        return security
    security = Security(cusip=cusip, name=name, ticker=ticker)
    db.add(security)
    db.commit()
    db.refresh(security)
    return security


def sync_institution_filings(db: Session, institution: Institution, limit: int = 8) -> list[Filing]:
    """Pull the latest N 13F-HR filings + their holdings from EDGAR and upsert them."""
    summaries = edgar_client.get_recent_13f_filings(institution.cik, limit=limit)
    synced: list[Filing] = []

    for summary in summaries:
        existing = db.scalar(
            select(Filing).where(
                Filing.institution_id == institution.id,
                Filing.accession_number == summary.accession_number,
            )
        )
        if existing:
            synced.append(existing)
            continue

        rows = edgar_client.get_holdings_for_filing(institution.cik, summary.accession_number)
        total_value = sum(r.value_usd for r in rows)

        filing = Filing(
            institution_id=institution.id,
            accession_number=summary.accession_number,
            form_type=summary.form_type,
            filing_date=summary.filing_date,
            period_of_report=summary.period_of_report,
            total_value=total_value,
        )
        db.add(filing)
        db.flush()

        for row in rows:
            if not row.cusip:
                continue
            security = get_or_create_security(db, row.cusip, row.name_of_issuer, row.ticker)
            weight = (row.value_usd / total_value) if total_value > 0 else 0.0
            db.add(
                Holding(
                    filing_id=filing.id,
                    security_id=security.id,
                    shares=row.shares,
                    value_usd=row.value_usd,
                    weight=weight,
                )
            )
        db.commit()
        db.refresh(filing)
        synced.append(filing)

    return synced
