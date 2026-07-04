from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class BacktestRequest(BaseModel):
    benchmark_ticker: str = Field(default="SPY")
    start_date: date | None = None
    end_date: date | None = None
    rebalance_frequency: str = Field(default="quarterly", pattern="^(quarterly|annually)$")
    initial_capital: float = Field(default=1_000_000.0, gt=0)


class EquityPoint(BaseModel):
    date: date
    value: float


class BacktestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    benchmark_ticker: str
    start_date: date
    end_date: date
    rebalance_frequency: str
    cagr: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    alpha_annualized: float
    beta: float
    benchmark_cagr: float
    benchmark_volatility: float
    benchmark_max_drawdown: float
    equity_curve: list[EquityPoint]
    benchmark_curve: list[EquityPoint]
    created_at: datetime
