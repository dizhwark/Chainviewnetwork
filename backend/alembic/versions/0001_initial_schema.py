"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "institutions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cik", sa.String(10), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("cik"),
    )
    op.create_index("ix_institutions_cik", "institutions", ["cik"])
    op.create_index("ix_institutions_name", "institutions", ["name"])

    op.create_table(
        "securities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cusip", sa.String(16), nullable=False),
        sa.Column("ticker", sa.String(16), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.UniqueConstraint("cusip"),
    )
    op.create_index("ix_securities_cusip", "securities", ["cusip"])
    op.create_index("ix_securities_ticker", "securities", ["ticker"])

    op.create_table(
        "filings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institution_id", sa.Integer(), sa.ForeignKey("institutions.id"), nullable=False),
        sa.Column("accession_number", sa.String(32), nullable=False),
        sa.Column("form_type", sa.String(16), nullable=False, server_default="13F-HR"),
        sa.Column("filing_date", sa.Date(), nullable=False),
        sa.Column("period_of_report", sa.Date(), nullable=False),
        sa.Column("total_value", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("institution_id", "accession_number", name="uq_filing_accession"),
    )
    op.create_index("ix_filings_accession_number", "filings", ["accession_number"])

    op.create_table(
        "holdings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("filing_id", sa.Integer(), sa.ForeignKey("filings.id"), nullable=False),
        sa.Column("security_id", sa.Integer(), sa.ForeignKey("securities.id"), nullable=False),
        sa.Column("shares", sa.Float(), nullable=False, server_default="0"),
        sa.Column("value_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("weight", sa.Float(), nullable=False, server_default="0"),
    )

    op.create_table(
        "price_bars",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("security_id", sa.Integer(), sa.ForeignKey("securities.id"), nullable=False),
        sa.Column("trade_date", sa.Date(), nullable=False),
        sa.Column("close", sa.Float(), nullable=False),
        sa.Column("adj_close", sa.Float(), nullable=False),
        sa.UniqueConstraint("security_id", "trade_date", name="uq_price_security_date"),
    )
    op.create_index("ix_price_bars_trade_date", "price_bars", ["trade_date"])

    op.create_table(
        "factor_exposures",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institution_id", sa.Integer(), sa.ForeignKey("institutions.id"), nullable=False),
        sa.Column("as_of_date", sa.Date(), nullable=False),
        sa.Column("model_name", sa.String(64), nullable=False, server_default="FF5+MOM"),
        sa.Column("alpha_annualized", sa.Float(), nullable=False),
        sa.Column("r_squared", sa.Float(), nullable=False),
        sa.Column("mkt_rf_beta", sa.Float(), nullable=False),
        sa.Column("smb_beta", sa.Float(), nullable=False),
        sa.Column("hml_beta", sa.Float(), nullable=False),
        sa.Column("rmw_beta", sa.Float(), nullable=False),
        sa.Column("cma_beta", sa.Float(), nullable=False),
        sa.Column("mom_beta", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "backtest_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institution_id", sa.Integer(), sa.ForeignKey("institutions.id"), nullable=False),
        sa.Column("benchmark_ticker", sa.String(16), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("rebalance_frequency", sa.String(16), nullable=False, server_default="quarterly"),
        sa.Column("cagr", sa.Float(), nullable=False),
        sa.Column("volatility", sa.Float(), nullable=False),
        sa.Column("sharpe_ratio", sa.Float(), nullable=False),
        sa.Column("max_drawdown", sa.Float(), nullable=False),
        sa.Column("alpha_annualized", sa.Float(), nullable=False),
        sa.Column("beta", sa.Float(), nullable=False),
        sa.Column("benchmark_cagr", sa.Float(), nullable=False),
        sa.Column("benchmark_volatility", sa.Float(), nullable=False),
        sa.Column("benchmark_max_drawdown", sa.Float(), nullable=False),
        sa.Column("equity_curve", sa.JSON(), nullable=False),
        sa.Column("benchmark_curve", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("backtest_results")
    op.drop_table("factor_exposures")
    op.drop_table("price_bars")
    op.drop_table("holdings")
    op.drop_table("filings")
    op.drop_table("securities")
    op.drop_table("institutions")
