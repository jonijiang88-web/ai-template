import { createBrowserClient } from '@supabase/ssr'

/**
 * 创建 Supabase 浏览器端（Client Component）客户端实例。
 *
 * 用于所有客户端组件中访问 Supabase Auth 和 Data API，
 * 使用 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 初始化。
 *
 * @returns Supabase 客户端实例（支持浏览器端 cookie 管理）
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
