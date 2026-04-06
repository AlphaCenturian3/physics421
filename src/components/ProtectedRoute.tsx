import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────

const spinnerStyles: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-primary, #0f0f14)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const dotStyles: React.CSSProperties = {
  width: '2rem',
  height: '2rem',
  border: '3px solid rgba(79,142,247,0.25)',
  borderTopColor: 'var(--accent-blue, #4f8ef7)',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  // Hard deadline: if auth hasn't resolved after 5 s, stop blocking the UI.
  const [hardTimeout, setHardTimeout] = useState(false)

  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => {
      if (import.meta.env.DEV) console.warn('[ProtectedRoute] hard timeout — auth never resolved, treating as unauthenticated')
      setHardTimeout(true)
    }, 5000)
    return () => clearTimeout(t)
  }, [loading])

  if (import.meta.env.DEV) console.log('[ProtectedRoute] loading:', loading, 'hardTimeout:', hardTimeout, 'user:', user?.email ?? 'none')

  // Still resolving session (and within the hard deadline)
  if (loading && !hardTimeout) {
    return (
      <div style={spinnerStyles}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={dotStyles} />
      </div>
    )
  }

  // Supabase not configured → bypass auth, render children
  if (!isSupabaseConfigured) {
    return <>{children}</>
  }

  // Supabase configured but no user (or hard timeout) → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Authenticated
  return <>{children}</>
}
