import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 创建 Supabase 服务端（Server Component / Route Handler）客户端实例。
 *
 * 适配 Next.js 16 的 async cookies() API，
 * 通过服务端 cookie 管理维持 Supabase Auth session。Server Component 中的
 * Cookie 写入会交由 proxy.ts 完成，避免 Next.js 渲染阶段的写入异常。
 * 使用 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 初始化。
 *
 * @param accessToken - 可选的 Bearer Token，用于移动端请求的 RLS 数据访问
 * @returns Supabase 服务端客户端实例（Route Handler 支持 Cookie 写入）
 */
export async function createClient(accessToken?: string) {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component 不允许修改 Cookie，交由 proxy.ts 刷新会话。
          }
        },
      },
    },
  )
}
