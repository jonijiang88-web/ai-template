import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getMessages, sendMessage } from '../../_service/chat'
import { BizException } from '../../_lib/BizException'
import { withApiErrorHandler } from '../../_lib/api-error-handler'

/**
 * POST 请求体校验 schema：要求 body 为对象，message 为字符串，
 * trim 后长度在 1-4000 字符之间。
 */
const postSchema = z.object({
  message: z.string().trim().min(1).max(4000),
})

/**
 * 获取聊天消息列表（需登录）。
 * 使用 Supabase auth.getUser() 鉴权，userId 由服务端获取，不接受客户端传入。
 * 认证失败时抛出 BizException，由 withApiErrorHandler 统一处理。
 */
async function getHandler() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new BizException('UNAUTHORIZED', '未登录', 401)
  }

  const messages = await getMessages(supabase, user.id)
  return Response.json({ messages })
}

/**
 * 发送聊天消息（需登录 + 请求体校验）。
 * 使用 Supabase auth.getUser() 鉴权，userId 由服务端获取。
 * 认证失败、请求体非法时均抛出 BizException，由 withApiErrorHandler 统一处理。
 */
async function postHandler(request?: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new BizException('UNAUTHORIZED', '未登录', 401)
  }

  // 尝试解析 JSON，若失败则抛出 BizException
  if (!request) {
    throw new BizException('INVALID_JSON', '请求体不是合法的 JSON', 400)
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new BizException('INVALID_JSON', '请求体不是合法的 JSON', 400)
  }

  // 使用 zod 校验请求体
  const result = postSchema.safeParse(body)
  if (!result.success) {
    throw new BizException(
      'VALIDATION_ERROR',
      'message 必须为 1-4000 个字符',
      400,
    )
  }

  const reply = await sendMessage(supabase, user.id, result.data.message)

  return Response.json({ reply })
}

/** GET /api/chat — 获取聊天消息列表，需登录，按当前用户隔离 */
export const GET = withApiErrorHandler(getHandler)

/** POST /api/chat — 发送聊天消息，需登录，message 校验通过后调用 sendMessage */
export const POST = withApiErrorHandler(postHandler)
