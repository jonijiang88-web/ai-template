import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { describe, expect, it } from 'vitest'

const environment = loadEnv('test', process.cwd(), '')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? environment.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const hasSupabaseEnvironment = Boolean(supabaseUrl && supabasePublishableKey)

/**
 * 远程 Supabase 连通性与匿名 RLS 集成测试。
 *
 * 未配置本地环境变量时跳过，以免 CI 依赖远程测试项目。
 */
describe.skipIf(!hasSupabaseEnvironment)('Supabase 远程集成', () => {
  const supabase = createClient(supabaseUrl!, supabasePublishableKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  it('可以访问已迁移的 messages 表', async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .limit(1)

    // 验证：Data API 可以访问 messages 表，说明远程项目、凭据和迁移均有效
    expect(error).toBeNull()
    // 验证：RLS 过滤后的查询结果仍为数组结构
    expect(Array.isArray(data)).toBe(true)
  })

  it('匿名请求不能插入消息', async () => {
    const { error } = await supabase.from('messages').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      role: 'user',
      content: 'anonymous-rls-check',
    })

    // 验证：匿名请求被 RLS 拒绝，测试过程不会写入数据
    expect(error).not.toBeNull()
    // 验证：拒绝原因是 PostgreSQL 权限不足，而非表结构或网络错误
    expect(error?.code).toBe('42501')
  })
})
