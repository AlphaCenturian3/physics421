import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useAppStore } from '../store/appStore'
import { isSupabaseConfigured } from '../lib/supabase'

const NAV_LINKS = [
  { path: '/',         label: 'Dashboard' },
  { path: '/practice', label: 'Practice'  },
  { path: '/tutor',    label: 'AI Tutor'  },
]

export default function NavBar() {
  const location    = useLocation()
  const navigate    = useNavigate()
  const { user, signOut } = useAuth()
  const displayName = useAppStore(s => s.displayName)
  const progress    = useAppStore(s => s.progress)
  const [signingOut, setSigningOut] = useState(false)

  const completedCount = Object.values(progress).filter(Boolean).length

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    navigate('/login')
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: '56px',
      backgroundColor: 'rgba(15,15,20,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <style>{`
        .nav-link { padding:0.375rem 0.875rem; border-radius:9999px; font-size:0.875rem; font-weight:500; text-decoration:none; transition:background 0.15s,color 0.15s; }
        .nav-link:hover { background:rgba(255,255,255,0.06); color:var(--text-primary) !important; }
        .nav-link.active { background:var(--accent-blue); color:#fff !important; }
        .nav-link.inactive { color:var(--text-secondary); }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ color: 'var(--accent-blue)', fontSize: '1.125rem' }}>⚡</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>Physics 421</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
          {NAV_LINKS.map(({ path, label }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path} className={`nav-link ${active ? 'active' : 'inactive'}`}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Progress pill */}
          {completedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(79,222,152,0.1)', border: '1px solid rgba(79,222,152,0.2)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4fde98' }} />
              <span style={{ color: '#4fde98', fontSize: '0.75rem', fontWeight: 600 }}>{completedCount}/17</span>
            </div>
          )}

          {/* User / auth */}
          {isSupabaseConfigured && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {(displayName ?? user.email) && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName ?? user.email}
                </span>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                style={{ padding: '0.3rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--text-secondary)'; el.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)' }}
              >
                {signingOut ? '…' : 'Log out'}
              </button>
            </div>
          ) : isSupabaseConfigured ? (
            <Link to="/login" style={{ padding: '0.3rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent-blue)'; el.style.color = 'var(--accent-blue)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)' }}>
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
