import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'
import type { UserProfile } from '../types'
import { useAppStore } from '../store/appStore'

interface AuthResult { error: string | null }

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<AuthResult>
  signUp: (username: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
}

// Supabase requires an email — derive a synthetic one from the username.
// Users never see or use this email; it's purely internal.
function toEmail(username: string): string {
  const safe = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_')
  return `${safe}@physics421.local`
}

const AuthContext = createContext<AuthContextValue | null>(null)

// When Supabase is not configured: bypass auth entirely
const mockAuthValue: AuthContextValue = {
  user: null,
  profile: null,
  loading: false,
  signIn:  async () => ({ error: null }),
  signUp:  async () => ({ error: null }),
  signOut: async () => ({ error: null }),
}

async function fetchProfile(userId: string, email: string): Promise<UserProfile | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', userId)
      .single()
    if (error || !data) return null
    return {
      id: data.id as string,
      email,
      displayName: (data.display_name as string | null) ?? null,
      role: (data.role as string) ?? 'student',
    }
  } catch {
    return null
  }
}

// Separate inner component so hooks are always called in the same order
function ConfiguredAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setStoreUser, clearUser } = useAppStore()

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[auth] init started')

    let settled = false
    const finish = () => {
      if (!settled) {
        settled = true
        if (import.meta.env.DEV) console.log('[auth] init finished')
        setLoading(false)
      }
    }

    // Safety timeout — fires if getSession never resolves (network down, etc.)
    const loadingTimeout = setTimeout(() => {
      if (import.meta.env.DEV) console.warn('[auth] safety timeout fired — Supabase unreachable or slow')
      finish()
    }, 3000)

    // Restore session on mount
    supabase!.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      if (import.meta.env.DEV) console.log('[auth] getSession resolved, user:', u?.email ?? 'none')
      setUser(u)
      // Unblock the UI immediately — profile is non-critical and loads async below
      clearTimeout(loadingTimeout)
      finish()
      if (u) {
        // Fetch profile after loading is already false — never blocks the spinner
        fetchProfile(u.id, u.email ?? '').then((p) => {
          setProfile(p)
          setStoreUser(u.email ?? null, p?.displayName ?? null)
          if (import.meta.env.DEV) console.log('[auth] profile loaded:', p?.displayName ?? 'none')
        })
      }
    }).catch((err) => {
      if (import.meta.env.DEV) console.warn('[auth] getSession error:', err)
      clearTimeout(loadingTimeout)
      finish()
    })

    // Keep in sync across tabs / token refresh
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (_event, session) => {
        if (import.meta.env.DEV) console.log('[auth] onAuthStateChange:', _event)
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          const p = await fetchProfile(u.id, u.email ?? '')
          setProfile(p)
          setStoreUser(u.email ?? null, p?.displayName ?? null)
        } else {
          setProfile(null)
          clearUser()
        }
        finish()
      }
    )
    return () => {
      // Clear the safety timeout on unmount (e.g. React StrictMode double-invoke)
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase!.auth.signInWithPassword({ email: toEmail(username), password })
      if (!error && data.user) setUser(data.user)
      return { error: error?.message ?? null }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error — check your connection.'
      return { error: msg }
    }
  }

  const signUp = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase!.auth.signUp({
        email: toEmail(username),
        password,
        options: { data: { display_name: username } },
      })
      return { error: error?.message ?? null }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error — check your connection.'
      return { error: msg }
    }
  }

  const signOut = async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase!.auth.signOut()
      clearUser()
      return { error: error?.message ?? null }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign-out failed.'
      return { error: msg }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured || !supabase) {
    return (
      <AuthContext.Provider value={mockAuthValue}>
        {children}
      </AuthContext.Provider>
    )
  }
  return <ConfiguredAuthProvider>{children}</ConfiguredAuthProvider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
