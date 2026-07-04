export type AccountType = 'asset' | 'liability'

export const ASSET_CATEGORIES = [
  'Cash & Bank',
  'Investments',
  'Retirement',
  'Real Estate',
  'Vehicle',
  'Other Asset',
] as const

export const LIABILITY_CATEGORIES = [
  'Credit Card',
  'Student Loan',
  'Auto Loan',
  'Mortgage',
  'Personal Loan',
  'Other Liability',
] as const

export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  category: string
  balance: number
  createdAt: string
  updatedAt: string
}

export interface NetWorthSnapshot {
  id: string
  userId: string
  snapshotDate: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  createdAt: string
}

export type CashFlowType = 'income' | 'expense'

export const INCOME_CATEGORIES = ['Salary', 'Investment Income', 'Side Income', 'Other Income'] as const
export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Utilities',
  'Insurance',
  'Entertainment',
  'Debt Payment',
  'Savings & Investing',
  'Other Expense',
] as const

export interface CashFlowEntry {
  id: string
  userId: string
  entryDate: string
  description: string
  category: string
  type: CashFlowType
  amount: number
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string | null
}
