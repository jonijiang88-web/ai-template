import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 仅允许 Supabase 认证回调跳转至本站相对路径，防止开放重定向。
 *
 * @param next - 回调 URL 中携带的目标路径
 * @returns 可安全使用的站内路径
 */
export function getSafeNextPath(next: string | null): string {
  if (next?.startsWith('/') && !next.startsWith('//')) {
    return next
  }

  return '/chat'
}

/**
 * GET /auth/callback — Supabase Auth code exchange 回调处理。
 *
 * 用户在 Supabase Auth 完成邮箱密码登录后，会被重定向至此路由。
 * 该路由将 URL 中的 authorization code 交换为 session cookie，
 * 然后重定向到原始目标页面（或默认 /chat）。
 *
 * 此路由是浏览器重定向协议端点，不能使用 JSON 错误包装器；所有异常均
 * 转为登录页重定向，避免破坏 Supabase 回调语义或泄漏内部错误。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeNextPath(searchParams.get('next'))

  try {
    if (code) {
      const supabase = await createClient()
      // 将 authorization code 交换为 session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  } catch {
    // 回调失败统一跳转至登录页，不向浏览器暴露认证服务错误。
  }

  // code 缺失或 exchange 失败，重定向到登录页
  return NextResponse.redirect(`${origin}/login?message=无法完成登录，请重试`)
}
