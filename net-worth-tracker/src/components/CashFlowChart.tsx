import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import type { CashFlowEntry } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { STATUS, prefersDark } from '../lib/palette'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export function CashFlowChart({ entries }: { entries: CashFlowEntry[] }) {
  const dark = prefersDark()
  const goodColor = dark ? STATUS.good.dark : STATUS.good.light
  const criticalColor = dark ? STATUS.critical.dark : STATUS.critical.light
  const gridColor = dark ? '#2c2c2a' : '#e1e0d9'
  const inkColor = dark ? '#c3c2b7' : '#52514e'

  const months = useMemo(() => {
    const totals = new Map<string, { income: number; expense: number }>()
    for (const entry of entries) {
      const key = monthKey(entry.entryDate)
      const bucket = totals.get(key) ?? { income: 0, expense: 0 }
      if (entry.type === 'income') bucket.income += entry.amount
      else bucket.expense += entry.amount
      totals.set(key, bucket)
    }
    return Array.from(totals.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [entries])

  if (months.length === 0) {
    return <div className="empty-state">No cash flow entries yet — add income or expenses below.</div>
  }

  const data = {
    labels: months.map(([key]) => monthLabel(key)),
    datasets: [
      {
        label: 'Income',
        data: months.map(([, v]) => v.income),
        backgroundColor: goodColor,
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: months.map(([, v]) => v.expense),
        backgroundColor: criticalColor,
        borderRadius: 4,
      },
    ],
  }

  return (
    <div className="chart-wrap">
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: { color: inkColor, boxWidth: 10, boxHeight: 10 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y as number)}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: inkColor } },
            y: {
              grid: { color: gridColor },
              ticks: { color: inkColor, callback: (value) => formatCurrency(Number(value)) },
            },
          },
        }}
      />
    </div>
  )
}
