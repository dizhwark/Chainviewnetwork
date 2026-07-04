from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"))
    benchmark_ticker: Mapped[str] = mapped_column(String(16))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    rebalance_frequency: Mapped[str] = mapped_column(String(16), default="quarterly")

    cagr: Mapped[float] = mapped_column(Float)
    volatility: Mapped[float] = mapped_column(Float)
    sharpe_ratio: Mapped[float] = mapped_column(Float)
    max_drawdown: Mapped[float] = mapped_column(Float)
    alpha_annualized: Mapped[float] = mapped_column(Float)
    beta: Mapped[float] = mapped_column(Float)
    benchmark_cagr: Mapped[float] = mapped_column(Float)
    benchmark_volatility: Mapped[float] = mapped_column(Float)
    benchmark_max_drawdown: Mapped[float] = mapped_column(Float)

    equity_curve: Mapped[list] = mapped_column(JSON)
    benchmark_curve: Mapped[list] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    institution: Mapped["Institution"] = relationship(back_populates="backtests")
