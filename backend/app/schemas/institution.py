from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class InstitutionBase(BaseModel):
    cik: str
    name: str


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionRead(InstitutionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class FilingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    accession_number: str
    form_type: str
    filing_date: date
    period_of_report: date
    total_value: float


class HoldingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticker: str | None
    name: str
    cusip: str
    shares: float
    value_usd: float
    weight: float


class InstitutionDetail(InstitutionRead):
    filings: list[FilingRead] = []
