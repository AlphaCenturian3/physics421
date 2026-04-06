import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Detect placeholder / missing values so the app never tries to fetch a fake URL
const PLACEHOLDER_PATTERNS = [
  'your-project-ref',
  'your_supabase',
  'placeholder',
  'example.com',
  'undefined',
  'null',
]

function isReal(val: string | undefined): boolean {
  if (!val || val.trim() === '') return false
  const lower = val.toLowerCase()
  return !PLACEHOLDER_PATTERNS.some(p => lower.includes(p))
}

export const isSupabaseConfigured = isReal(supabaseUrl) && isReal(supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null
