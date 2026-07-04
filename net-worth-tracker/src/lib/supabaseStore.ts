import type { SupabaseClient } from '@supabase/supabase-js'
import type { Account, CashFlowEntry, NetWorthSnapshot } from './types'
import type { DataStore } from './store'

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as Account['type'],
    category: row.category as string,
    balance: Number(row.balance),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapSnapshot(row: Record<string, unknown>): NetWorthSnapshot {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    snapshotDate: row.snapshot_date as string,
    totalAssets: Number(row.total_assets),
    totalLiabilities: Number(row.total_liabilities),
    netWorth: Number(row.net_worth),
    createdAt: row.created_at as string,
  }
}

function mapCashFlow(row: Record<string, unknown>): CashFlowEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    entryDate: row.entry_date as string,
    description: row.description as string,
    category: row.category as string,
    type: row.type as CashFlowEntry['type'],
    amount: Number(row.amount),
    createdAt: row.created_at as string,
  }
}

export function createSupabaseStore(client: SupabaseClient, userId: string): DataStore {
  return {
    async listAccounts() {
      const { data, error } = await client
        .from('accounts')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []).map(mapAccount)
    },

    async upsertAccount(input) {
      const payload = {
        ...(input.id ? { id: input.id } : {}),
        user_id: userId,
        name: input.name,
        type: input.type,
        category: input.category,
        balance: input.balance,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await client.from('accounts').upsert(payload).select().single()
      if (error) throw error
      return mapAccount(data)
    },

    async deleteAccount(id) {
      const { error } = await client.from('accounts').delete().eq('id', id)
      if (error) throw error
    },

    async listSnapshots() {
      const { data, error } = await client
        .from('net_worth_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: true })
      if (error) throw error
      return (data ?? []).map(mapSnapshot)
    },

    async recordSnapshot({ totalAssets, totalLiabilities, netWorth }) {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await client
        .from('net_worth_snapshots')
        .upsert(
          {
            user_id: userId,
            snapshot_date: today,
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            net_worth: netWorth,
          },
          { onConflict: 'user_id,snapshot_date' },
        )
        .select()
        .single()
      if (error) throw error
      return mapSnapshot(data)
    },

    async listCashFlowEntries() {
      const { data, error } = await client
        .from('cash_flow_entries')
        .select('*')
        .order('entry_date', { ascending: false })
      if (error) throw error
      return (data ?? []).map(mapCashFlow)
    },

    async addCashFlowEntry(entry) {
      const { data, error } = await client
        .from('cash_flow_entries')
        .insert({
          user_id: userId,
          entry_date: entry.entryDate,
          description: entry.description,
          category: entry.category,
          type: entry.type,
          amount: entry.amount,
        })
        .select()
        .single()
      if (error) throw error
      return mapCashFlow(data)
    },

    async deleteCashFlowEntry(id) {
      const { error } = await client.from('cash_flow_entries').delete().eq('id', id)
      if (error) throw error
    },
  }
}
