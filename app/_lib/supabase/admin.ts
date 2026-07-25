import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin 客户端 — 使用 service_role key，绕过 RLS。
 * 仅能在服务端 Route Handler 中使用，不得暴露给客户端。
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
