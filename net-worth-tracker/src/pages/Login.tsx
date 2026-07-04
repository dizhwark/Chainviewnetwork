import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { signInWithPassword, signUpWithPassword } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const result =
      mode === 'sign-in' ? await signInWithPassword(email, password) : await signUpWithPassword(email, password)
    setSubmitting(false)
    if (result) {
      setError(result)
    } else if (mode === 'sign-up') {
      setInfo('Account created. Check your email to confirm, then sign in.')
    }
  }

  return (
    <div className="login-shell">
      <div className="card login-card">
        <div className="toggle-row">
          <span className="section-title" style={{ margin: 0 }}>
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </span>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              setError(null)
              setInfo(null)
            }}
          >
            {mode === 'sign-in' ? 'Sign up instead' : 'Sign in instead'}
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          {info && <div className="stat-delta positive">{info}</div>}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
