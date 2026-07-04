import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { NetWorthSnapshot } from '../lib/types'
import { formatCurrency, formatMonth } from '../lib/format'
import { prefersDark } from '../lib/palette'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export function NetWorthGrowthChart({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  const dark = prefersDark()
  const lineColor = dark ? '#3987e5' : '#2a78d6'
  const fillColor = dark ? 'rgba(57,135,229,0.16)' : 'rgba(42,120,214,0.12)'
  const gridColor = dark ? '#2c2c2a' : '#e1e0d9'
  const inkColor = dark ? '#c3c2b7' : '#52514e'

  const data = useMemo(
    () => ({
      labels: snapshots.map((s) => formatMonth(s.snapshotDate)),
      datasets: [
        {
          label: 'Net worth',
          data: snapshots.map((s) => s.netWorth),
          borderColor: lineColor,
          backgroundColor: fillColor,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: lineColor,
          borderWidth: 2,
        },
      ],
    }),
    [snapshots, lineColor, fillColor],
  )

  if (snapshots.length === 0) {
    return <div className="empty-state">No snapshots yet — save one from the Accounts page to start tracking growth.</div>
  }

  return (
    <div className="chart-wrap">
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => formatCurrency(ctx.parsed.y as number),
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: inkColor } },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: inkColor,
                callback: (value) => formatCurrency(Number(value)),
              },
            },
          },
        }}
      />
    </div>
  )
}
