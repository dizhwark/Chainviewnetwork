import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BacktestResult } from "../api/client";

export default function EquityCurveChart({ result }: { result: BacktestResult }) {
  const byDate = new Map<string, { date: string; portfolio: number; benchmark: number }>();
  for (const p of result.equity_curve) {
    byDate.set(p.date, { date: p.date, portfolio: p.value, benchmark: 0 });
  }
  for (const p of result.benchmark_curve) {
    const existing = byDate.get(p.date);
    if (existing) existing.benchmark = p.value;
    else byDate.set(p.date, { date: p.date, portfolio: 0, benchmark: p.value });
  }
  const data = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={70} />
        <Tooltip
          formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="portfolio"
          name="Replicated portfolio"
          stroke="#5b8def"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="benchmark"
          name={result.benchmark_ticker}
          stroke="#9aa5b1"
          dot={false}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
