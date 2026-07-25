import { NextRequest, NextResponse } from 'next/server'
import { signup } from '@/app/_service/auth'

/**
 * POST /api/auth/signup — 注册新用户。
 *
 * 用 Supabase Admin API 创建用户，通过 Resend 发送多语言确认邮件。
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, locale } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'email 和 password 必填' }, { status: 400 })
    }

    await signup(email, password, locale ?? 'en')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[signup]', err)
    // Supabase 重复邮箱错误
    if (err instanceof Error && err.message.includes('already registered')) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
    }
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
