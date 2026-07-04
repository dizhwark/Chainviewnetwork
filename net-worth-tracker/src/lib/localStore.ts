import type { Account, CashFlowEntry, NetWorthSnapshot } from './types'
import type { DataStore } from './store'

const KEY_PREFIX = 'nwt-demo'

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}:${key}`)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]): void {
  localStorage.setItem(`${KEY_PREFIX}:${key}`, JSON.stringify(value))
}

function id(): string {
  return crypto.randomUUID()
}

const DEMO_USER_ID = 'demo-user'

export function createLocalStore(): DataStore {
  return {
    async listAccounts() {
      return read<Account>('accounts').sort((a, b) => a.name.localeCompare(b.name))
    },

    async upsertAccount(input) {
      const accounts = read<Account>('accounts')
      const now = new Date().toISOString()
      if (input.id) {
        const idx = accounts.findIndex((a) => a.id === input.id)
        if (idx >= 0) {
          const updated: Account = { ...accounts[idx], ...input, updatedAt: now }
          accounts[idx] = updated
          write('accounts', accounts)
          return updated
        }
      }
      const created: Account = {
        id: id(),
        userId: DEMO_USER_ID,
        name: input.name,
        type: input.type,
        category: input.category,
        balance: input.balance,
        createdAt: now,
        updatedAt: now,
      }
      accounts.push(created)
      write('accounts', accounts)
      return created
    },

    async deleteAccount(accountId) {
      write(
        'accounts',
        read<Account>('accounts').filter((a) => a.id !== accountId),
      )
    },

    async listSnapshots() {
      return read<NetWorthSnapshot>('snapshots').sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
    },

    async recordSnapshot({ totalAssets, totalLiabilities, netWorth }) {
      const snapshots = read<NetWorthSnapshot>('snapshots')
      const today = new Date().toISOString().slice(0, 10)
      const now = new Date().toISOString()
      const existingIdx = snapshots.findIndex((s) => s.snapshotDate === today)
      const snapshot: NetWorthSnapshot = {
        id: existingIdx >= 0 ? snapshots[existingIdx].id : id(),
        userId: DEMO_USER_ID,
        snapshotDate: today,
        totalAssets,
        totalLiabilities,
        netWorth,
        createdAt: existingIdx >= 0 ? snapshots[existingIdx].createdAt : now,
      }
      if (existingIdx >= 0) {
        snapshots[existingIdx] = snapshot
      } else {
        snapshots.push(snapshot)
      }
      write('snapshots', snapshots)
      return snapshot
    },

    async listCashFlowEntries() {
      return read<CashFlowEntry>('cashflow').sort((a, b) => b.entryDate.localeCompare(a.entryDate))
    },

    async addCashFlowEntry(entry) {
      const entries = read<CashFlowEntry>('cashflow')
      const created: CashFlowEntry = {
        id: id(),
        userId: DEMO_USER_ID,
        createdAt: new Date().toISOString(),
        ...entry,
      }
      entries.push(created)
      write('cashflow', entries)
      return created
    },

    async deleteCashFlowEntry(entryId) {
      write(
        'cashflow',
        read<CashFlowEntry>('cashflow').filter((e) => e.id !== entryId),
      )
    },
  }
}
