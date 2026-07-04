from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Security(Base):
    __tablename__ = "securities"

    id: Mapped[int] = mapped_column(primary_key=True)
    cusip: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    ticker: Mapped[str | None] = mapped_column(String(16), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255))

    holdings: Mapped[list["Holding"]] = relationship(back_populates="security")
    price_bars: Mapped[list["PriceBar"]] = relationship(back_populates="security", cascade="all, delete-orphan")
