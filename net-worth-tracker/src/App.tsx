import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Accounts } from './pages/Accounts'
import { CashFlow } from './pages/CashFlow'
import { Login } from './pages/Login'

export default function App() {
  const { user, loading, isDemoMode } = useAuth()

  if (!isDemoMode && loading) {
    return <div className="empty-state" style={{ padding: 40 }}>Loading…</div>
  }

  if (!isDemoMode && !user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/cash-flow" element={<CashFlow />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
