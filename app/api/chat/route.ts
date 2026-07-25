import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from 'ai'
import { deepSeek } from '@ai-sdk/deepseek'
import { createClient } from '@/app/_lib/supabase/server'
import { getMessages, saveMessages, toUIMessage } from '../../_service/chat'
import { BizException } from '../../_lib/BizException'
import { withApiErrorHandler } from '../../_lib/api-error-handler'

/** 从 UIMessage 数组中提取最后一条用户消息的文本内容 */
function extractUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'user') {
      return msg.parts
        .filter(p => p.type === 'text')
        .map(p => (p as { text: string }).text)
        .join('')
    }
  }
  return ''
}

/**
 * 获取聊天消息列表（需登录）。
 * 转为前端可用的 UIMessage 数组。
 */
async function getHandler() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new BizException('UNAUTHORIZED', '未登录', 401)
  }

  const records = await getMessages(supabase, user.id)
  const messages = records.map(toUIMessage)
  return Response.json({ messages })
}

/**
 * 流式响应聊天消息（需登录）。
 * 使用 DeepSeek 模型生成回复，将结果流式返回客户端，
 * 完成后将对话持久化到 Supabase。
 */
async function postHandler(request?: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new BizException('UNAUTHORIZED', '未登录', 401)
  }

  if (!request) {
    throw new BizException('INVALID_JSON', '请求体不是合法的 JSON', 400)
  }

  let body: { messages: UIMessage[] }
  try {
    body = await request.json()
  } catch {
    throw new BizException('INVALID_JSON', '请求体不是合法的 JSON', 400)
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new BizException('VALIDATION_ERROR', 'messages 必须为非空数组', 400)
  }

  // 提取用户最新消息用于后续持久化
  const userContent = extractUserText(body.messages)

  const result = streamText({
    model: deepSeek('deepseek-v4-flash'),
    messages: await convertToModelMessages(body.messages),
    onFinish: async ({ text }) => {
      // 持久化：用户消息 + AI 回复
      if (userContent) {
        await saveMessages(supabase, user.id, userContent, text)
      }
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}

/** GET /api/chat — 获取聊天历史，需登录，返回 UIMessage 数组 */
export const GET = withApiErrorHandler(getHandler)

/** POST /api/chat — 流式聊天，需登录，使用 DeepSeek 生成回复 */
export const POST = withApiErrorHandler(postHandler)
