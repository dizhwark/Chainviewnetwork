import type { CashFlowEntry } from '../lib/types'
import { formatCurrency, formatDate } from '../lib/format'

interface Props {
  entries: CashFlowEntry[]
  onDelete: (id: string) => void
}

export function CashFlowList({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return <div className="empty-state">No entries yet.</div>
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{formatDate(entry.entryDate)}</td>
            <td>{entry.description}</td>
            <td>{entry.category}</td>
            <td className={entry.type === 'income' ? 'stat-delta positive' : 'stat-delta negative'}>
              {entry.type === 'income' ? '+' : '-'}
              {formatCurrency(entry.amount)}
            </td>
            <td>
              <button className="btn danger" onClick={() => onDelete(entry.id)}>
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
