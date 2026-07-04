import type { Account, CashFlowEntry, NetWorthSnapshot } from './types'

export interface DataStore {
  listAccounts(): Promise<Account[]>
  upsertAccount(account: Partial<Account> & { name: string; type: Account['type']; category: string; balance: number }): Promise<Account>
  deleteAccount(id: string): Promise<void>

  listSnapshots(): Promise<NetWorthSnapshot[]>
  recordSnapshot(snapshot: { totalAssets: number; totalLiabilities: number; netWorth: number }): Promise<NetWorthSnapshot>

  listCashFlowEntries(): Promise<CashFlowEntry[]>
  addCashFlowEntry(entry: {
    entryDate: string
    description: string
    category: string
    type: CashFlowEntry['type']
    amount: number
  }): Promise<CashFlowEntry>
  deleteCashFlowEntry(id: string): Promise<void>
}
