import { useEffect, useState } from 'react'
import { useDataStore } from '../context/DataContext'
import type { Account, NetWorthSnapshot } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { NetWorthGrowthChart } from '../components/NetWorthGrowthChart'
import { AllocationChart } from '../components/AllocationChart'

export function Dashboard() {
  const store = useDataStore()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([store.listAccounts(), store.listSnapshots()]).then(([a, s]) => {
      if (cancelled) return
      setAccounts(a)
      setSnapshots(s)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [store])

  if (loading) return <div className="empty-state">Loading…</div>

  const totalAssets = accounts.filter((a) => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = accounts.filter((a) => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0)
  const netWorth = totalAssets - totalLiabilities

  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null
  const delta = previous ? netWorth - previous.netWorth : null

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Your current net worth and how it's trending over time.</p>

      <div className="grid grid-3">
        <div className="card">
          <p className="stat-label">Net worth</p>
          <p className="stat-value">{formatCurrency(netWorth)}</p>
          {delta !== null && (
            <p className={`stat-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
              {delta >= 0 ? '+' : ''}
              {formatCurrency(delta)} since last snapshot
            </p>
          )}
        </div>
        <div className="card">
          <p className="stat-label">Total assets</p>
          <p className="stat-value">{formatCurrency(totalAssets)}</p>
        </div>
        <div className="card">
          <p className="stat-label">Total liabilities</p>
          <p className="stat-value">{formatCurrency(totalLiabilities)}</p>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Net worth growth</p>
        <NetWorthGrowthChart snapshots={snapshots} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <p className="section-title">Asset allocation</p>
          <AllocationChart accounts={accounts} type="asset" />
        </div>
        <div className="card">
          <p className="section-title">Liability breakdown</p>
          <AllocationChart accounts={accounts} type="liability" />
        </div>
      </div>
    </div>
  )
}
