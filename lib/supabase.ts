import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceRole) {
  // We'll still export a client but warn at runtime if used without config
  console.warn('Supabase URL or Service Role key not configured. Audit logging to Supabase will fail until configured.')
}

export const supabaseAdmin = createClient(url || '', serviceRole || '')
export const supabaseAnon = createClient(url || '', anonKey || '')
