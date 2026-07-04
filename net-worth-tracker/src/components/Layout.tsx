import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export function Layout({ children }: { children: ReactNode }) {
  const { user, isDemoMode, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Net Worth Tracker</div>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/accounts" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Accounts
          </NavLink>
          <NavLink to="/cash-flow" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Cash Flow
          </NavLink>
        </nav>

        {!isDemoMode && user && (
          <div>
            <div className="account-info">{user.email}</div>
            <button className="btn secondary" style={{ marginTop: 10, width: '100%' }} onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        )}

        {isDemoMode && (
          <div className="demo-banner">
            Running in local demo mode. Data is stored only in this browser. Connect Supabase
            (see README) to sync across devices with real auth.
          </div>
        )}
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
