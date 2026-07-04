import { useEffect, useState } from 'react'
import { useDataStore } from '../context/DataContext'
import type { Account } from '../lib/types'
import { AccountForm } from '../components/AccountForm'
import { AccountList } from '../components/AccountList'
import { formatCurrency } from '../lib/format'

export function Accounts() {
  const store = useDataStore()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null)

  async function refresh() {
    setAccounts(await store.listAccounts())
  }

  useEffect(() => {
    refresh().then(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  async function handleAdd(input: { name: string; type: Account['type']; category: string; balance: number }) {
    await store.upsertAccount(input)
    await refresh()
  }

  async function handleDelete(id: string) {
    await store.deleteAccount(id)
    await refresh()
  }

  async function handleSnapshot() {
    const totalAssets = accounts.filter((a) => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0)
    const totalLiabilities = accounts.filter((a) => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0)
    await store.recordSnapshot({ totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities })
    setSnapshotMessage(`Snapshot saved: ${formatCurrency(totalAssets - totalLiabilities)} net worth`)
    setTimeout(() => setSnapshotMessage(null), 4000)
  }

  if (loading) return <div className="empty-state">Loading…</div>

  return (
    <div>
      <div className="toggle-row">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Add every asset and liability, then save a snapshot to track growth.</p>
        </div>
        <button className="btn" onClick={handleSnapshot}>
          Save snapshot
        </button>
      </div>
      {snapshotMessage && <p className="stat-delta positive">{snapshotMessage}</p>}

      <div className="card">
        <p className="section-title">Add an account</p>
        <AccountForm onSubmit={handleAdd} />
      </div>

      <div className="card">
        <AccountList title="Assets" accounts={accounts.filter((a) => a.type === 'asset')} onDelete={handleDelete} />
      </div>
      <div className="card">
        <AccountList
          title="Liabilities"
          accounts={accounts.filter((a) => a.type === 'liability')}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
