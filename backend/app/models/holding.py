from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id: Mapped[int] = mapped_column(primary_key=True)
    filing_id: Mapped[int] = mapped_column(ForeignKey("filings.id"))
    security_id: Mapped[int] = mapped_column(ForeignKey("securities.id"))
    shares: Mapped[float] = mapped_column(Float, default=0.0)
    value_usd: Mapped[float] = mapped_column(Float, default=0.0)
    weight: Mapped[float] = mapped_column(Float, default=0.0)

    filing: Mapped["Filing"] = relationship(back_populates="holdings")
    security: Mapped["Security"] = relationship(back_populates="holdings")
