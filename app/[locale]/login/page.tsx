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

      if (isSignUp) {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, locale: locale === 'en' ? 'en' : 'zh-CN' }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || '注册失败')
            setLoading(false)
            return
          }
          setMessage(t('signUpSuccess'))
          setLoading(false)
          return
        } catch {
          setError('网络错误')
          setLoading(false)
          return
        }
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
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
    <div className="flex flex-1 justify-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          {isSignUp ? t('signUpTitle') : t('signInTitle')}
        </h1>
        <p className="mb-7 text-sm leading-6 text-muted">
          {isSignUp
              ? t('signUpDescription')
              : t('signInDescription')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-foreground"
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
              className="w-full rounded-[6px] border border-border px-3 py-2.5 text-sm text-foreground outline-none transition-colors duration-150 ease-in-out placeholder:text-placeholder focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-foreground"
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
              className="w-full rounded-[6px] border border-border px-3 py-2.5 text-sm text-foreground outline-none transition-colors duration-150 ease-in-out placeholder:text-placeholder focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          {message && (
            <p className="text-sm text-success">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full rounded-[6px] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-in-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          >
            {loading
              ? t('processing')
              : isSignUp
              ? t('signUp')
              : t('signIn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignUp ? (
            <>
              {t('hasAccount')}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null) }}
                className="rounded-[4px] text-accent transition-colors duration-150 ease-in-out hover:text-accent-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                className="rounded-[4px] text-accent transition-colors duration-150 ease-in-out hover:text-accent-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
