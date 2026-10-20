import { createClient } from '@supabase/supabase-js'

// Gibutangan nato og tapak (fallback) aron dili mag-error ang Vercel kung mag-build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kjamgzsszkryrvizeejd.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key-placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey)
