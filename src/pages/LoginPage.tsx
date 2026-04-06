import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const { error: authError } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (authError) { setError(authError); return }
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.7rem 1rem; color:#fff; font-size:0.95rem; outline:none; box-sizing:border-box; transition:border-color 0.15s; font-family:inherit; }
        .auth-input:focus { border-color: var(--accent-blue); }
        .auth-input:disabled { opacity:0.5; cursor:not-allowed; }
        .auth-btn { width:100%; background:var(--accent-blue); color:#fff; border:none; border-radius:8px; padding:0.75rem; font-size:0.95rem; font-weight:600; cursor:pointer; transition:opacity 0.15s; font-family:inherit; letter-spacing:0.01em; }
        .auth-btn:hover:not(:disabled) { opacity:0.88; }
        .auth-btn:disabled { opacity:0.45; cursor:not-allowed; }
      `}</style>

      {/* Left panel — branding */}
      <div style={{
        width: '40%', minWidth: '300px', background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle radial glow */}
        <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.625rem', lineHeight: 1.1 }}>
            Physics 421
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            E&amp;M interactive visualizations, practice questions, and an AI tutor — designed for visual learners.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['17 interactive simulations', 'AI physics tutor', 'Custom practice builder', 'ADHD-friendly design'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '26rem' }}
        >
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Sign in
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Welcome back. Enter your credentials to continue.
          </p>

          {/* Not-configured notice */}
          {!isSupabaseConfigured && (
            <div style={{ background: 'rgba(247,169,79,0.08)', border: '1px solid rgba(247,169,79,0.25)', borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--accent-amber)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Auth not configured</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.55 }}>
                Add <code style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.75rem' }}>VITE_SUPABASE_URL</code> and <code style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.75rem' }}>VITE_SUPABASE_ANON_KEY</code> to your <code style={{ background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.75rem' }}>.env</code> file to enable accounts.
              </p>
              <Link to="/" style={{ display: 'inline-block', marginTop: '0.625rem', color: 'var(--accent-amber)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                Continue without account →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Email address
              </label>
              <input className="auth-input" type="email" autoComplete="email" value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!isSupabaseConfigured || submitting}
                placeholder="you@example.com" required />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
              </div>
              <input className="auth-input" type="password" autoComplete="current-password" value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={!isSupabaseConfigured || submitting}
                placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{ background: 'rgba(247,95,95,0.08)', border: '1px solid rgba(247,95,95,0.25)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <p style={{ color: '#f77f7f', fontSize: '0.875rem', lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            <button className="auth-btn" type="submit" disabled={!isSupabaseConfigured || submitting} style={{ marginTop: '0.25rem' }}>
              {submitting
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Signing in…
                  </span>
                : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
