'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

  return (
    <nav className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-3">
      <Link
        href="/"
        className="text-sm font-semibold text-[#1a1a1a] hover:text-[#5e6ad2] transition"
      >
        Hello Next.js
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/chat"
          className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition"
        >
          ChatBox
        </Link>
        {loading ? (
          <span className="text-sm text-[#a0a0a0]">Loading...</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#6b6b6b]">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm text-[#5e6ad2] hover:text-[#4f5ad0] transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
