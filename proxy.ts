import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Next.js 16 Proxy（原 Middleware）—— Supabase Auth session 自动刷新。
 *
 * 在每个请求中检查并刷新 Supabase Auth cookie（排除静态资源），
 * 确保用户 session 保持有效，同时避免不必要的 cookie 刷新开销。
 *
 * @param request - 当前 Next.js 请求对象
 * @returns 更新后的 NextResponse（已包含最新的 Auth cookie）
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  /**
   * 匹配所有请求路径，静态资源已在 proxy 函数内部跳过。
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
