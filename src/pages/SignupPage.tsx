import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabase'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, signIn } = useAuth()

  const [username,        setUsername]        = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!username.trim())               { setError('Username is required.'); return }
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username.trim()))
                                        { setError('Username: 3–32 characters, letters/numbers/._- only.'); return }
    if (password.length < 8)            { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword)   { setError('Passwords do not match.'); return }

    setError(null)
    setSubmitting(true)

    const { error: signUpError } = await signUp(username.trim(), password)
    if (signUpError) {
      setSubmitting(false)
      const msg = signUpError.toLowerCase()
      if (msg.includes('already') || msg.includes('exists')) setError('That username is already taken.')
      else setError(signUpError)
      return
    }

    // Auto-sign in after signup (works when Supabase email confirmation is disabled)
    const { error: signInError } = await signIn(username.trim(), password)
    setSubmitting(false)
    if (signInError) {
      // Email confirmation may be required — send them to login
      navigate('/login')
      return
    }
    navigate('/')
  }

  const disabled = !isSupabaseConfigured || submitting

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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>Create account</h1>
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
            disabled={disabled}
            placeholder="Username"
            required
            autoFocus
          />
          <input
            className="ai"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={disabled}
            placeholder="Password (min. 8 characters)"
            required
          />
          <input
            className="ai"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            disabled={disabled}
            placeholder="Confirm password"
            required
          />

          {error && (
            <p style={{ color: '#f77f7f', fontSize: '0.8125rem', margin: 0 }}>{error}</p>
          )}

          <button className="ab" type="submit" disabled={disabled} style={{ marginTop: '0.25rem' }}>
            {submitting
              ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Creating account…
                </span>
              : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
