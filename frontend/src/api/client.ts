import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({ baseURL });

export interface InstitutionSearchResult {
  cik: string;
  name: string;
}

export interface Institution {
  id: number;
  cik: string;
  name: string;
  created_at: string;
}

export interface Filing {
  id: number;
  accession_number: string;
  form_type: string;
  filing_date: string;
  period_of_report: string;
  total_value: number;
}

export interface InstitutionDetail extends Institution {
  filings: Filing[];
}

export interface Holding {
  ticker: string | null;
  name: string;
  cusip: string;
  shares: number;
  value_usd: number;
  weight: number;
}

export interface FactorExposure {
  id: number;
  institution_id: number;
  as_of_date: string;
  model_name: string;
  alpha_annualized: number;
  r_squared: number;
  mkt_rf_beta: number;
  smb_beta: number;
  hml_beta: number;
  rmw_beta: number;
  cma_beta: number;
  mom_beta: number;
  created_at: string;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface BacktestResult {
  id: number;
  institution_id: number;
  benchmark_ticker: string;
  start_date: string;
  end_date: string;
  rebalance_frequency: string;
  cagr: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  alpha_annualized: number;
  beta: number;
  benchmark_cagr: number;
  benchmark_volatility: number;
  benchmark_max_drawdown: number;
  equity_curve: EquityPoint[];
  benchmark_curve: EquityPoint[];
  created_at: string;
}

export const searchInstitutions = (q: string) =>
  api.get<InstitutionSearchResult[]>("/api/institutions/search", { params: { q } }).then((r) => r.data);

export const listInstitutions = () => api.get<Institution[]>("/api/institutions").then((r) => r.data);

export const syncInstitution = (cik: string, name: string, limit = 8) =>
  api
    .post<InstitutionDetail>(`/api/institutions/${cik}/sync`, null, { params: { name, limit } })
    .then((r) => r.data);

export const getInstitution = (id: number) =>
  api.get<InstitutionDetail>(`/api/institutions/${id}`).then((r) => r.data);

export const getFilingHoldings = (filingId: number) =>
  api.get<Holding[]>(`/api/filings/${filingId}/holdings`).then((r) => r.data);

export const computeFactorExposure = (institutionId: number, lookbackYears = 3) =>
  api
    .post<FactorExposure>(`/api/institutions/${institutionId}/factor-exposure`, null, {
      params: { lookback_years: lookbackYears },
    })
    .then((r) => r.data);

export const listFactorExposures = (institutionId: number) =>
  api.get<FactorExposure[]>(`/api/institutions/${institutionId}/factor-exposure`).then((r) => r.data);

export const runBacktest = (
  institutionId: number,
  params: { benchmark_ticker: string; rebalance_frequency: string; initial_capital: number },
) => api.post<BacktestResult>(`/api/institutions/${institutionId}/backtest`, params).then((r) => r.data);

export const listBacktests = (institutionId: number) =>
  api.get<BacktestResult[]>(`/api/institutions/${institutionId}/backtest`).then((r) => r.data);
