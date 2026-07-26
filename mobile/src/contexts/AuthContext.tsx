import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSupabaseClient } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

/**
 * Auth 上下文类型。
 */
interface AuthContextType {
  /** 当前用户，null 表示未登录 */
  user: User | null
  /** Supabase session */
  session: Session | null
  /** 是否正在加载初始状态 */
  loading: boolean
  /** 运行时配置错误 */
  configurationError: string | null
  /** 邮箱密码登录 */
  signIn: (email: string, password: string) => Promise<void>
  /** 邮箱密码注册 */
  signUp: (email: string, password: string) => Promise<void>
  /** 退出登录 */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider —— 管理认证状态。
 *
 * 在 app/_layout 中包裹全局使用，提供 user、session 及登录注册函数。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [configurationError] = useState<string | null>(() => {
    try {
      getSupabaseClient()
      return null
    } catch (error) {
      return error instanceof Error ? error.message : '应用配置不可用'
    }
  })
  const [loading, setLoading] = useState(() => configurationError === null)

  useEffect(() => {
    if (configurationError) return

    const supabase = getSupabaseClient()
    // 恢复持久化的 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听 auth 状态变化
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [configurationError])

  /** 邮箱密码登录 */
  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  /** 邮箱密码注册 */
  const signUp = async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  /** 退出登录 */
  const signOut = async () => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, configurationError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用 Auth Context 的 Hook。
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
