from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ChainView Institutional Portfolio Replication Engine"
    database_url: str = "postgresql+psycopg://chainview:chainview@postgres:5432/chainview"
    sec_user_agent: str = "ChainView Network research@chainview.network"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    default_benchmark_ticker: str = "SPY"
    risk_free_rate_annual: float = 0.04
    http_timeout_seconds: float = 20.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
