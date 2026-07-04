import { useState, type FormEvent } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CashFlowType } from '../lib/types'
import { todayISODate } from '../lib/format'

interface Props {
  onSubmit: (input: {
    entryDate: string
    description: string
    category: string
    type: CashFlowType
    amount: number
  }) => Promise<void>
}

export function CashFlowForm({ onSubmit }: Props) {
  const [type, setType] = useState<CashFlowType>('income')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [entryDate, setEntryDate] = useState(todayISODate())
  const [submitting, setSubmitting] = useState(false)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!description.trim() || Number.isNaN(numericAmount)) return
    setSubmitting(true)
    await onSubmit({
      entryDate,
      description: description.trim(),
      category,
      type,
      amount: Math.abs(numericAmount),
    })
    setSubmitting(false)
    setDescription('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="form-row">
      <div className="field">
        <label htmlFor="cf-date">Date</label>
        <input id="cf-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="cf-type">Type</label>
        <select
          id="cf-type"
          value={type}
          onChange={(e) => {
            const next = e.target.value as CashFlowType
            setType(next)
            setCategory(next === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
          }}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="cf-category">Category</label>
        <select id="cf-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="cf-description">Description</label>
        <input
          id="cf-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Paycheck"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="cf-amount">Amount</label>
        <input
          id="cf-amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
