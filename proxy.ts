import createIntlMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/app/_lib/supabase/middleware'
import { routing } from '@/app/_lib/i18n/routing'

const handleIntlRouting = createIntlMiddleware(routing)

/**
 * Next.js 16 Proxy（原 Middleware）—— Supabase Auth session 自动刷新。
 *
 * 页面请求执行 locale 协商后刷新 Supabase Auth cookie；API 和认证回调
 * 保持稳定路径，仅执行会话刷新。
 *
 * @param request - 当前 Next.js 请求对象
 * @returns 更新后的 NextResponse（已包含最新的 Auth cookie）
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    return updateSession(request)
  }

  const sessionResponse = await updateSession(request)
  const intlResponse = handleIntlRouting(request)

  // 先刷新 request Cookie，使 next-intl rewrite 的内部请求读取到最新 session。
  // next-intl 负责 rewrite/redirect，Supabase 的刷新 Cookie 还需附加到该响应。
  sessionResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie)
  })

  return intlResponse
}

export const config = {
  /**
   * 匹配所有请求路径，静态资源已在 proxy 函数内部跳过。
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
