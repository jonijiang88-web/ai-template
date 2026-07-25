import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 消息记录类型，对应 supabase/migrations 中 public.messages 表。
 */
export type MessageRecord = {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/**
 * 获取指定用户的消息列表，按 created_at 升序排列。
 *
 * userId 由服务端调用方（Route Handler）从 auth.getUser() 获取，
 * 应用层不得接受客户端传入的 userId。
 *
 * @param supabase - Supabase 服务端客户端实例
 * @param userId   - 用户 UUID（由 auth.getUser() 提供）
 * @returns 消息记录数组
 */
export async function getMessages(
  supabase: SupabaseClient,
  userId: string,
): Promise<MessageRecord[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * 发送消息：一次性插入 user 消息和 assistant 自动回复两条记录。
 *
 * userId 由服务端调用方（Route Handler）从 auth.getUser() 获取，
 * 应用层不得接受客户端传入的 userId。RLS 是数据隔离的主要保障。
 *
 * @param supabase - Supabase 服务端客户端实例
 * @param userId   - 用户 UUID（由 auth.getUser() 提供）
 * @param content  - 用户消息内容
 * @returns 机器人回复文本
 */
export async function sendMessage(
  supabase: SupabaseClient,
  userId: string,
  content: string,
): Promise<string> {
  const reply = `You said: "${content}"`

  const { error } = await supabase.from('messages').insert([
    { user_id: userId, role: 'user', content },
    { user_id: userId, role: 'assistant', content: reply },
  ])

  if (error) {
    throw error
  }

  return reply
}
