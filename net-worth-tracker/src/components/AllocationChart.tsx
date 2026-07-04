import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import type { Account } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { categoricalColors, prefersDark } from '../lib/palette'

ChartJS.register(ArcElement, Tooltip, Legend)

export function AllocationChart({ accounts, type }: { accounts: Account[]; type: 'asset' | 'liability' }) {
  const dark = prefersDark()
  const filtered = useMemo(() => accounts.filter((a) => a.type === type && a.balance > 0), [accounts, type])

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const account of filtered) {
      totals.set(account.category, (totals.get(account.category) ?? 0) + account.balance)
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const colors = categoricalColors(byCategory.length, dark)

  if (byCategory.length === 0) {
    return (
      <div className="empty-state">No {type === 'asset' ? 'assets' : 'liabilities'} yet — add one on the Accounts page.</div>
    )
  }

  const data = {
    labels: byCategory.map(([category]) => category),
    datasets: [
      {
        data: byCategory.map(([, total]) => total),
        backgroundColor: colors,
        borderColor: dark ? '#1a1a19' : '#fcfcfb',
        borderWidth: 2,
      },
    ],
  }

  return (
    <div>
      <div className="chart-wrap small">
        <Doughnut
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed as number)}`,
                },
              },
            },
          }}
        />
      </div>
      <div className="legend-row">
        {byCategory.map(([category], i) => (
          <span className="pill" key={category}>
            <span className="dot" style={{ background: colors[i] }} />
            {category}
          </span>
        ))}
      </div>
    </div>
  )
}
