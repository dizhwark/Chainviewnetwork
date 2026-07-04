import { useEffect, useState } from 'react'
import { useDataStore } from '../context/DataContext'
import type { CashFlowEntry } from '../lib/types'
import { CashFlowForm } from '../components/CashFlowForm'
import { CashFlowList } from '../components/CashFlowList'
import { CashFlowChart } from '../components/CashFlowChart'
import { formatCurrency } from '../lib/format'

export function CashFlow() {
  const store = useDataStore()
  const [entries, setEntries] = useState<CashFlowEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setEntries(await store.listCashFlowEntries())
  }

  useEffect(() => {
    refresh().then(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  async function handleAdd(input: {
    entryDate: string
    description: string
    category: string
    type: CashFlowEntry['type']
    amount: number
  }) {
    await store.addCashFlowEntry(input)
    await refresh()
  }

  async function handleDelete(id: string) {
    await store.deleteCashFlowEntry(id)
    await refresh()
  }

  if (loading) return <div className="empty-state">Loading…</div>

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthEntries = entries.filter((e) => e.entryDate.slice(0, 7) === currentMonth)
  const income = thisMonthEntries.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
  const expenses = thisMonthEntries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <h1 className="page-title">Cash Flow</h1>
      <p className="page-subtitle">Track monthly income and expenses to see how your cash flow trends.</p>

      <div className="grid grid-3">
        <div className="card">
          <p className="stat-label">This month's income</p>
          <p className="stat-value">{formatCurrency(income)}</p>
        </div>
        <div className="card">
          <p className="stat-label">This month's expenses</p>
          <p className="stat-value">{formatCurrency(expenses)}</p>
        </div>
        <div className="card">
          <p className="stat-label">Net cash flow</p>
          <p className="stat-value">{formatCurrency(income - expenses)}</p>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Monthly income vs. expenses</p>
        <CashFlowChart entries={entries} />
      </div>

      <div className="card">
        <p className="section-title">Add an entry</p>
        <CashFlowForm onSubmit={handleAdd} />
      </div>

      <div className="card">
        <p className="section-title">All entries</p>
        <CashFlowList entries={entries} onDelete={handleDelete} />
      </div>
    </div>
  )
}
