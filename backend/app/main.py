from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import backtests, factors, holdings, institutions

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Recreate hedge fund portfolios from 13F filings, estimate factor "
    "exposures, backtest performance, and compare against benchmarks.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(institutions.router)
app.include_router(holdings.router)
app.include_router(factors.router)
app.include_router(backtests.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": settings.app_name}
