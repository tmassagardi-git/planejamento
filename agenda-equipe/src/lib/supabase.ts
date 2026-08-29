import { createClient } from '@supabase/supabase-js'

// Internal team tool, no login yet — this key is meant to be public.
// Data access is controlled by RLS policies in the Supabase project, not by hiding this key.
export const SUPABASE_URL = 'https://najnyuhtjnwiqiubfiyv.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_iembFAJor5RgdO2oLFaMJQ_eGsKE02L'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
