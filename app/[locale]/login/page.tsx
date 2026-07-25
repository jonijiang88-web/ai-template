'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/app/_lib/supabase/client'
import { useRouter } from '@/app/_lib/i18n/navigation'

/**
 * 登录/注册页面 —— 使用 Supabase Auth 的邮箱密码方式。
 *
 * 支持两种模式：
 * - 登录（sign in）：使用已有账户的邮箱密码
 * - 注册（sign up）：创建新账户
 *
 * UI 遵循 Linear 风格：极简、专注、高效。
 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Login')
  const supabase = useMemo(() => createClient(), [])

  /**
   * 处理表单提交：执行登录或注册操作。
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)
      setMessage(null)

      const callbackPath = locale === 'en' ? '/en/chat' : '/chat'

      const { error: authError } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackPath)}`,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (isSignUp) {
        // 注册成功后提示查收确认邮件
        setMessage(t('signUpSuccess'))
        setLoading(false)
        return
      }

      // 登录成功后重定向到聊天页
      router.push('/chat')
      router.refresh()
    },
    [email, password, isSignUp, locale, router, supabase, t],
  )

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-1">
          {isSignUp ? t('signUpTitle') : t('signInTitle')}
        </h1>
        <p className="text-sm text-[#6b6b6b] mb-8">
          {isSignUp
              ? t('signUpDescription')
              : t('signInDescription')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-[#1a1a1a] block mb-1"
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#a0a0a0] focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2] disabled:opacity-40"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-[#1a1a1a] block mb-1"
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="w-full rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#a0a0a0] focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2] disabled:opacity-40"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-[#ef4444]">{error}</p>
          )}

          {message && (
            <p className="text-sm text-[#22c55e]">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full rounded-md bg-[#5e6ad2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4f5ad0] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading
              ? t('processing')
              : isSignUp
              ? t('signUp')
              : t('signIn')}
          </button>
        </form>

        <p className="text-sm text-[#6b6b6b] mt-6 text-center">
          {isSignUp ? (
            <>
              {t('hasAccount')}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null) }}
                className="text-[#5e6ad2] hover:underline"
              >
                {t('signIn')}
              </button>
            </>
          ) : (
            <>
              {t('noAccount')}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); setMessage(null) }}
                className="text-[#5e6ad2] hover:underline"
              >
                {t('createOne')}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
