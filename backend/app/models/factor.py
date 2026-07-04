from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FactorExposure(Base):
    """Stores a factor-regression snapshot (e.g. Fama-French 5 + Momentum) for an institution."""

    __tablename__ = "factor_exposures"

    id: Mapped[int] = mapped_column(primary_key=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"))
    as_of_date: Mapped[date] = mapped_column(Date)
    model_name: Mapped[str] = mapped_column(String(64), default="FF5+MOM")
    alpha_annualized: Mapped[float] = mapped_column(Float)
    r_squared: Mapped[float] = mapped_column(Float)
    mkt_rf_beta: Mapped[float] = mapped_column(Float)
    smb_beta: Mapped[float] = mapped_column(Float)
    hml_beta: Mapped[float] = mapped_column(Float)
    rmw_beta: Mapped[float] = mapped_column(Float)
    cma_beta: Mapped[float] = mapped_column(Float)
    mom_beta: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    institution: Mapped["Institution"] = relationship(back_populates="factor_exposures")
