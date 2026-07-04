import type { Account } from '../lib/types'
import { formatCurrency } from '../lib/format'

interface Props {
  title: string
  accounts: Account[]
  onDelete: (id: string) => void
}

export function AccountList({ title, accounts, onDelete }: Props) {
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div>
      <div className="toggle-row">
        <span className="section-title" style={{ margin: 0 }}>
          {title}
        </span>
        <span className="stat-label" style={{ margin: 0 }}>
          {formatCurrency(total)}
        </span>
      </div>
      {accounts.length === 0 ? (
        <div className="empty-state">Nothing here yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Balance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.category}</td>
                <td>{formatCurrency(a.balance)}</td>
                <td>
                  <button className="btn danger" onClick={() => onDelete(a.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
