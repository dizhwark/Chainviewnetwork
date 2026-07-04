import { useState } from "react";
import { useParams } from "react-router-dom";

import {
  BacktestResult,
  FactorExposure,
  Filing,
  Holding,
  computeFactorExposure,
  getFilingHoldings,
  getInstitution,
  runBacktest,
  syncInstitution,
} from "../api/client";
import EquityCurveChart from "../components/EquityCurveChart";
import FactorBarChart from "../components/FactorBarChart";
import { useAsync } from "../hooks/useAsync";

const currency = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export default function InstitutionDetail() {
  const { id } = useParams();
  const institutionId = Number(id);

  const { data: institution, reload: reloadInstitution } = useAsync(
    () => getInstitution(institutionId),
    [institutionId],
  );

  const [selectedFilingId, setSelectedFilingId] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  const [factorExposure, setFactorExposure] = useState<FactorExposure | null>(null);
  const [factorLoading, setFactorLoading] = useState(false);
  const [factorError, setFactorError] = useState<string | null>(null);

  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestError, setBacktestError] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState("SPY");
  const [syncing, setSyncing] = useState(false);

  async function loadHoldings(filing: Filing) {
    setSelectedFilingId(filing.id);
    setHoldingsLoading(true);
    try {
      const rows = await getFilingHoldings(filing.id);
      setHoldings(rows);
    } finally {
      setHoldingsLoading(false);
    }
  }

  async function handleSync() {
    if (!institution) return;
    setSyncing(true);
    try {
      await syncInstitution(institution.cik, institution.name);
      await reloadInstitution();
    } finally {
      setSyncing(false);
    }
  }

  async function handleFactorExposure() {
    setFactorLoading(true);
    setFactorError(null);
    try {
      const result = await computeFactorExposure(institutionId);
      setFactorExposure(result);
    } catch (err) {
      setFactorError(describeError(err));
    } finally {
      setFactorLoading(false);
    }
  }

  async function handleBacktest() {
    setBacktestLoading(true);
    setBacktestError(null);
    try {
      const result = await runBacktest(institutionId, {
        benchmark_ticker: benchmark,
        rebalance_frequency: "quarterly",
        initial_capital: 1_000_000,
      });
      setBacktest(result);
    } catch (err) {
      setBacktestError(describeError(err));
    } finally {
      setBacktestLoading(false);
    }
  }

  if (!institution) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <section className="card">
        <div className="row-between">
          <div>
            <h1>{institution.name}</h1>
            <p className="muted">CIK {institution.cik}</p>
          </div>
          <button onClick={handleSync} disabled={syncing}>
            {syncing ? "Syncing…" : "Refresh filings"}
          </button>
        </div>

        <h3>Filings</h3>
        {!institution.filings.length && <p className="muted">No filings synced yet.</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Filed</th>
              <th>Form</th>
              <th>Reported value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {institution.filings.map((f) => (
              <tr key={f.id} className={f.id === selectedFilingId ? "selected" : ""}>
                <td>{f.period_of_report}</td>
                <td>{f.filing_date}</td>
                <td>{f.form_type}</td>
                <td>{currency(f.total_value)}</td>
                <td>
                  <button onClick={() => loadHoldings(f)}>View holdings</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedFilingId && (
        <section className="card">
          <h2>Replicated holdings</h2>
          {holdingsLoading && <p className="muted">Loading holdings…</p>}
          {!holdingsLoading && holdings && (
            <table className="table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>Shares</th>
                  <th>Value</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.cusip}>
                    <td>{h.ticker ?? "—"}</td>
                    <td>{h.name}</td>
                    <td>{h.shares.toLocaleString()}</td>
                    <td>{currency(h.value_usd)}</td>
                    <td>{pct(h.weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <section className="card">
        <div className="row-between">
          <h2>Factor exposure</h2>
          <button onClick={handleFactorExposure} disabled={factorLoading}>
            {factorLoading ? "Estimating…" : "Estimate exposure"}
          </button>
        </div>
        <p className="muted">
          OLS regression of the replicated portfolio's daily returns against the Fama-French
          5-factor model plus momentum.
        </p>
        {factorError && <p className="error">{factorError}</p>}
        {factorExposure && (
          <>
            <div className="metrics-row">
              <Metric label="Annualized alpha" value={pct(factorExposure.alpha_annualized)} />
              <Metric label="R²" value={factorExposure.r_squared.toFixed(3)} />
              <Metric label="Market beta" value={factorExposure.mkt_rf_beta.toFixed(2)} />
            </div>
            <FactorBarChart exposure={factorExposure} />
          </>
        )}
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Backtest vs. benchmark</h2>
          <div className="inline-form">
            <select value={benchmark} onChange={(e) => setBenchmark(e.target.value)}>
              <option value="SPY">SPY (S&amp;P 500)</option>
              <option value="QQQ">QQQ (Nasdaq 100)</option>
              <option value="IWM">IWM (Russell 2000)</option>
              <option value="DIA">DIA (Dow Jones)</option>
            </select>
            <button onClick={handleBacktest} disabled={backtestLoading}>
              {backtestLoading ? "Running…" : "Run backtest"}
            </button>
          </div>
        </div>
        {backtestError && <p className="error">{backtestError}</p>}
        {backtest && (
          <>
            <div className="metrics-row">
              <Metric label="CAGR" value={pct(backtest.cagr)} sub={`bench ${pct(backtest.benchmark_cagr)}`} />
              <Metric label="Volatility" value={pct(backtest.volatility)} />
              <Metric label="Sharpe" value={backtest.sharpe_ratio.toFixed(2)} />
              <Metric label="Max drawdown" value={pct(backtest.max_drawdown)} />
              <Metric label="Alpha" value={pct(backtest.alpha_annualized)} />
              <Metric label="Beta" value={backtest.beta.toFixed(2)} />
            </div>
            <EquityCurveChart result={backtest} />
          </>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  );
}

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Something went wrong. Please try again.";
}
