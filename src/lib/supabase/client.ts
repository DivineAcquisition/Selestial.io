import { createBrowserClient } from '@supabase/ssr'

// Fallback values prevent @supabase/ssr from throwing during Next.js
// static generation when env vars are not yet available (e.g. Vercel build).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
