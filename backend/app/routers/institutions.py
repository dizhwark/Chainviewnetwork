from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Institution
from app.schemas.institution import InstitutionDetail, InstitutionRead
from app.services import edgar_client, ingestion

router = APIRouter(prefix="/api/institutions", tags=["institutions"])


@router.get("/search")
def search_institutions(q: str, limit: int = 10):
    """Search SEC EDGAR for 13F-filing institutions by name (live lookup, not cached)."""
    try:
        matches = edgar_client.search_institutions(q, limit=limit)
    except Exception as exc:  # network/parse failures shouldn't 500 the whole app
        raise HTTPException(status_code=502, detail=f"EDGAR lookup failed: {exc}") from exc
    return [{"cik": m.cik, "name": m.name} for m in matches]


@router.get("", response_model=list[InstitutionRead])
def list_institutions(db: Session = Depends(get_db)):
    return db.scalars(select(Institution).order_by(Institution.name)).all()


@router.post("/{cik}/sync", response_model=InstitutionDetail)
def sync_institution(cik: str, name: str, limit: int = 8, db: Session = Depends(get_db)):
    """Fetch (or refresh) an institution's recent 13F-HR filings + holdings from EDGAR."""
    institution = ingestion.get_or_create_institution(db, cik, name)
    try:
        ingestion.sync_institution_filings(db, institution, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"EDGAR sync failed: {exc}") from exc
    db.refresh(institution)
    return institution


@router.get("/{institution_id}", response_model=InstitutionDetail)
def get_institution(institution_id: int, db: Session = Depends(get_db)):
    institution = db.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    return institution
