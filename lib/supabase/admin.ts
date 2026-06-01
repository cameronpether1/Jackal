import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Used in webhook handlers that have no user session.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
