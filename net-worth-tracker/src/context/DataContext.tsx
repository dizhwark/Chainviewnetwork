import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createLocalStore } from '../lib/localStore'
import { createSupabaseStore } from '../lib/supabaseStore'
import type { DataStore } from '../lib/store'
import { useAuth } from './AuthContext'

const DataContext = createContext<DataStore | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isDemoMode } = useAuth()

  const store = useMemo<DataStore | null>(() => {
    if (isDemoMode) return createLocalStore()
    if (supabase && user) return createSupabaseStore(supabase, user.id)
    return null
  }, [isDemoMode, user])

  return <DataContext.Provider value={store}>{children}</DataContext.Provider>
}

export function useDataStore(): DataStore {
  const store = useContext(DataContext)
  if (!store) throw new Error('No data store available — are you signed in?')
  return store
}
