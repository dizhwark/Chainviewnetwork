from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(primary_key=True)
    cik: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    filings: Mapped[list["Filing"]] = relationship(back_populates="institution", cascade="all, delete-orphan")
    backtests: Mapped[list["BacktestResult"]] = relationship(back_populates="institution", cascade="all, delete-orphan")
    factor_exposures: Mapped[list["FactorExposure"]] = relationship(back_populates="institution", cascade="all, delete-orphan")
