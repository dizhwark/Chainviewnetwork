import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import type { AuthUser } from '../lib/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isDemoMode: boolean
  signInWithPassword: (email: string, password: string) => Promise<string | null>
  signUpWithPassword: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_USER: AuthUser = { id: 'demo-user', email: 'demo@local' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const isDemoMode = !isSupabaseConfigured
  const [user, setUser] = useState<AuthUser | null>(isDemoMode ? DEMO_USER : null)
  const [loading, setLoading] = useState(!isDemoMode)

  useEffect(() => {
    if (isDemoMode || !supabase) return

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? null } : null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? null } : null)
    })

    return () => listener.subscription.unsubscribe()
  }, [isDemoMode])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemoMode,
      async signInWithPassword(email, password) {
        if (!supabase) return 'Supabase is not configured.'
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? error.message : null
      },
      async signUpWithPassword(email, password) {
        if (!supabase) return 'Supabase is not configured.'
        const { error } = await supabase.auth.signUp({ email, password })
        return error ? error.message : null
      },
      async signOut() {
        if (!supabase) return
        await supabase.auth.signOut()
      },
    }),
    [user, loading, isDemoMode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
