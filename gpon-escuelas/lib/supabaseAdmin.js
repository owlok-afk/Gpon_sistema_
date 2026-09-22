// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    'Faltan variables de entorno para el cliente admin (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY)'
  )
}

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})