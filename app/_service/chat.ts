import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'

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
 * 将数据库消息记录转为 AI SDK UIMessage 格式。
 *
 * @param record - 数据库消息记录
 * @returns UIMessage 对象
 */
export function toUIMessage(record: MessageRecord): UIMessage {
  return {
    id: record.id,
    role: record.role,
    parts: [{ type: 'text', text: record.content }],
  }
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
 * 保存用户消息和 AI 回复到数据库。
 *
 * 由 API Route Handler 在 AI 回复完成后调用。
 *
 * @param supabase        - Supabase 服务端客户端实例
 * @param userId          - 用户 UUID（由 auth.getUser() 提供）
 * @param userContent     - 用户消息文本
 * @param assistantReply  - AI 回复文本
 */
export async function saveMessages(
  supabase: SupabaseClient,
  userId: string,
  userContent: string,
  assistantReply: string,
): Promise<void> {
  const { error } = await supabase.from('messages').insert([
    { user_id: userId, role: 'user', content: userContent },
    { user_id: userId, role: 'assistant', content: assistantReply },
  ])

  if (error) {
    console.error('Failed to save messages:', error)
  }
}
