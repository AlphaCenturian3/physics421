import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [username,   setUsername]   = useState('')
  const [password,   setPassword]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || !username.trim()) return
    setError(null)
    setSubmitting(true)
    const { error: authError } = await signIn(username.trim(), password)
    setSubmitting(false)
    if (authError) { setError('Wrong username or password.'); return }
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '1.5rem',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ai { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.7rem 1rem; color:#fff; font-size:0.95rem; outline:none; box-sizing:border-box; transition:border-color 0.15s; font-family:inherit; }
        .ai:focus { border-color:var(--accent-blue); }
        .ai:disabled { opacity:0.5; cursor:not-allowed; }
        .ab { width:100%; background:var(--accent-blue); color:#fff; border:none; border-radius:8px; padding:0.75rem; font-size:0.95rem; font-weight:600; cursor:pointer; transition:opacity 0.15s; font-family:inherit; }
        .ab:hover:not(:disabled) { opacity:0.88; }
        .ab:disabled { opacity:0.45; cursor:not-allowed; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ width: '100%', maxWidth: '22rem' }}
      >
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem' }}>⚡</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>Physics 421</h1>
        </div>

        {!isSupabaseConfigured && (
          <div style={{ background: 'rgba(247,169,79,0.08)', border: '1px solid rgba(247,169,79,0.25)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--accent-amber)', fontSize: '0.8125rem' }}>Auth not configured —{' '}
              <Link to="/" style={{ color: 'var(--accent-amber)', fontWeight: 600, textDecoration: 'none' }}>continue without account</Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <input
            className="ai"
            type="text"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={!isSupabaseConfigured || submitting}
            placeholder="Username"
            required
            autoFocus
          />
          <input
            className="ai"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={!isSupabaseConfigured || submitting}
            placeholder="Password"
            required
          />

          {error && (
            <p style={{ color: '#f77f7f', fontSize: '0.8125rem', margin: 0 }}>{error}</p>
          )}

          <button className="ab" type="submit" disabled={!isSupabaseConfigured || submitting} style={{ marginTop: '0.25rem' }}>
            {submitting
              ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Signing in…
                </span>
              : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
        </p>
      </motion.div>
    </div>
  )
}
