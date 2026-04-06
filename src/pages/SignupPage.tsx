import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [displayName,    setDisplayName]    = useState('')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [confirmPassword,setConfirmPassword]= useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [success,        setSuccess]        = useState(false)

  const validate = (): string | null => {
    if (!displayName.trim()) return 'Display name is required.'
    if (!email.trim())       return 'Email is required.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const ve = validate()
    if (ve) { setError(ve); return }
    setError(null)
    setSubmitting(true)
    const { error: authError } = await signUp(email.trim(), password, displayName.trim())
    setSubmitting(false)
    if (authError) { setError(authError); return }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 3500)
  }

  const disabled = !isSupabaseConfigured || submitting

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.7rem 1rem; color:#fff; font-size:0.95rem; outline:none; box-sizing:border-box; transition:border-color 0.15s; font-family:inherit; }
        .auth-input:focus { border-color: var(--accent-blue); }
        .auth-input:disabled { opacity:0.5; cursor:not-allowed; }
        .auth-btn { width:100%; background:var(--accent-blue); color:#fff; border:none; border-radius:8px; padding:0.75rem; font-size:0.95rem; font-weight:600; cursor:pointer; transition:opacity 0.15s; font-family:inherit; }
        .auth-btn:hover:not(:disabled) { opacity:0.88; }
        .auth-btn:disabled { opacity:0.45; cursor:not-allowed; }
      `}</style>

      {/* Left branding panel */}
      <div style={{
        width: '40%', minWidth: '300px', background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(79,222,152,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.625rem', lineHeight: 1.1 }}>
            Join Physics 421
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Create an account to save your progress, track your scores, and access your study history across sessions.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in →</Link>
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '26rem' }}
        >
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Create account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            It only takes a moment.
          </p>

          {!isSupabaseConfigured && (
            <div style={{ background: 'rgba(247,169,79,0.08)', border: '1px solid rgba(247,169,79,0.25)', borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--accent-amber)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Auth not configured</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.55 }}>
                Add Supabase credentials to <code style={{ background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.75rem' }}>.env</code> to enable accounts.
              </p>
              <Link to="/" style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--accent-amber)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}>
                Continue without account →
              </Link>
            </div>
          )}

          {success ? (
            <div style={{ background: 'rgba(79,222,152,0.08)', border: '1px solid rgba(79,222,152,0.25)', borderRadius: '8px', padding: '1.25rem' }}>
              <p style={{ color: '#4fde98', fontWeight: 700, marginBottom: '0.5rem' }}>Account created!</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.55 }}>
                Check your email to confirm your account, then{' '}
                <Link to="/login" style={{ color: '#4fde98', fontWeight: 600, textDecoration: 'none' }}>sign in</Link>.
                Redirecting in a moment…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Your name</label>
                <input className="auth-input" type="text" autoComplete="name" value={displayName}
                  onChange={e => setDisplayName(e.target.value)} disabled={disabled} placeholder="Ada Lovelace" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Email address</label>
                <input className="auth-input" type="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} disabled={disabled} placeholder="you@example.com" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 8 characters)</span></label>
                <input className="auth-input" type="password" autoComplete="new-password" value={password}
                  onChange={e => setPassword(e.target.value)} disabled={disabled} placeholder="••••••••" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Confirm password</label>
                <input className="auth-input" type="password" autoComplete="new-password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} disabled={disabled} placeholder="••••••••" required />
              </div>

              {error && (
                <div style={{ background: 'rgba(247,95,95,0.08)', border: '1px solid rgba(247,95,95,0.25)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                  <p style={{ color: '#f77f7f', fontSize: '0.875rem', lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              <button className="auth-btn" type="submit" disabled={disabled} style={{ marginTop: '0.25rem' }}>
                {submitting
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Creating account…
                    </span>
                  : 'Create account'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
