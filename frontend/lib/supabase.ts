import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Supports both new (sb_publishable_...) and legacy (eyJ...) key formats
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isConfigured = Boolean(supabaseUrl && supabaseKey)
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null

export type Article = {
  id: string
  title: string
  url: string
  summary: string | null
  source: string
  category: 'design' | 'it' | 'startup'
  image_url: string | null
  published_at: string
  collected_at: string
}
