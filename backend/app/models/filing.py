from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Filing(Base):
    __tablename__ = "filings"
    __table_args__ = (UniqueConstraint("institution_id", "accession_number", name="uq_filing_accession"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"))
    accession_number: Mapped[str] = mapped_column(String(32), index=True)
    form_type: Mapped[str] = mapped_column(String(16), default="13F-HR")
    filing_date: Mapped[date] = mapped_column(Date)
    period_of_report: Mapped[date] = mapped_column(Date)
    total_value: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    institution: Mapped["Institution"] = relationship(back_populates="filings")
    holdings: Mapped[list["Holding"]] = relationship(back_populates="filing", cascade="all, delete-orphan")
