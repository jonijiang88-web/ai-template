import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase 中间件工具函数 —— 刷新 Auth cookie 并返回更新后的响应。
 *
 * 在 Next.js Proxy 中调用，拦截匹配请求并自动刷新 Supabase session cookie。
 *
 * 处理流程：
 * 1. 基于当前请求 cookie 创建 Supabase 服务端客户端
 * 2. 调用 supabase.auth.getClaims() 触发 token 刷新（如有必要）
 * 3. 如果中途有 cookie 变更，将被 setAll 捕获并更新响应 cookie
 *
 * @param request - 当前 Next.js 请求对象
 * @returns 更新后的 NextResponse（已包含最新的 Auth cookie）
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // 调用 getClaims 触发 token 自动刷新（如果 session 已过期）
  await supabase.auth.getClaims()

  return supabaseResponse
}
