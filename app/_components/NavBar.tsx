'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/app/_lib/supabase/client'
import { Link, usePathname, useRouter } from '@/app/_lib/i18n/navigation'
import type { AppLocale } from '@/app/_lib/i18n/routing'
import type { User } from '@supabase/supabase-js'

/**
 * 导航栏组件 —— 显示应用标题、导航链接和当前用户登录状态。
 *
 * 使用 Supabase Auth 替代 NextAuth：
 * - 已登录：显示用户名 + 退出按钮
 * - 未登录：显示登录按钮，跳转到 /login
 */
export default function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Navigation')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    /**
     * 获取当前登录用户信息。
     */
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  /**
   * 处理退出登录：调用 Supabase signOut 后刷新页面。
   */
  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  /** 切换当前路由的显示语言，并保留当前位置。 */
  function handleLocaleChange(nextLocale: AppLocale) {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <nav className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-3">
      <Link
        href="/"
        className="text-sm font-semibold text-[#1a1a1a] hover:text-[#ea580c] transition"
      >
        {t('brand')}
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/chat"
          className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition"
        >
          {t('chat')}
        </Link>
        <label className="sr-only" htmlFor="locale">
          {t('language')}
        </label>
        <select
          id="locale"
          aria-label={t('language')}
          className="border-0 bg-transparent text-sm text-[#6b6b6b] outline-none hover:text-[#1a1a1a]"
          onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
          value={locale}
        >
          <option value="zh-CN">中文</option>
          <option value="en">English</option>
        </select>
        {loading ? (
          <span className="text-sm text-[#a0a0a0]">{t('loading')}</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#6b6b6b]">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition"
            >
              {t('signOut')}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm text-[#ea580c] hover:text-[#c2410c] transition"
          >
            {t('signIn')}
          </Link>
        )}
      </div>
    </nav>
  )
}
