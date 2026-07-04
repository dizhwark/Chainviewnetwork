import { useState, type FormEvent } from 'react'
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES, type AccountType } from '../lib/types'

interface Props {
  onSubmit: (input: { name: string; type: AccountType; category: string; balance: number }) => Promise<void>
}

export function AccountForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('asset')
  const [category, setCategory] = useState<string>(ASSET_CATEGORIES[0])
  const [balance, setBalance] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const categories = type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const numericBalance = Number(balance)
    if (!name.trim() || Number.isNaN(numericBalance)) return
    setSubmitting(true)
    await onSubmit({ name: name.trim(), type, category, balance: Math.abs(numericBalance) })
    setSubmitting(false)
    setName('')
    setBalance('')
  }

  return (
    <form onSubmit={handleSubmit} className="form-row">
      <div className="field">
        <label htmlFor="acct-name">Name</label>
        <input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase Checking" required />
      </div>
      <div className="field">
        <label htmlFor="acct-type">Type</label>
        <select
          id="acct-type"
          value={type}
          onChange={(e) => {
            const next = e.target.value as AccountType
            setType(next)
            setCategory(next === 'asset' ? ASSET_CATEGORIES[0] : LIABILITY_CATEGORIES[0])
          }}
        >
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="acct-category">Category</label>
        <select id="acct-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="acct-balance">Balance</label>
        <input
          id="acct-balance"
          type="number"
          min="0"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      <button className="btn" type="submit" disabled={submitting}>
        Add
      </button>
    </form>
  )
}
