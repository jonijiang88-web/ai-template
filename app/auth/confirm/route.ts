import { NextRequest, NextResponse } from 'next/server'
import { confirmEmail } from '@/app/_service/auth'

/**
 * GET /auth/confirm — 邮箱确认回调。
 *
 * 用户点击邮件中的确认链接后跳转至此路由，验证 token 并激活用户。
 * 成功后重定向到登录页面并显示成功消息。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const locale = searchParams.get('locale') ?? 'en'

  if (!token) {
    return NextResponse.redirect(`${origin}/${locale === 'en' ? 'en' : ''}/login?error=INVALID_LINK`)
  }

  try {
    const email = await confirmEmail(token)
    const path = locale === 'en' ? '/en/login' : '/login'
    return NextResponse.redirect(`${origin}${path}?confirmed=${encodeURIComponent(email)}`)
  } catch {
    const path = locale === 'en' ? '/en/login' : '/login'
    return NextResponse.redirect(`${origin}${path}?error=INVALID_LINK`)
  }
}
