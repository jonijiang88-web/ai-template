import { createClient } from './server'
import { BizException } from '@/app/_lib/BizException'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

/** 已认证请求可使用的用户与 Supabase 数据客户端。 */
export type AuthenticatedRequestContext = {
  user: User
  supabase: SupabaseClient
}

/** 已认证 Route Handler 的函数签名。 */
type AuthenticatedApiHandler<TArgs extends unknown[] = []> = (
  context: AuthenticatedRequestContext,
  request: Request,
  ...args: TArgs
) => Response | Promise<Response>

/**
 * 从请求中获取已认证用户。
 *
 * 支持两种鉴权方式（按优先级）：
 * 1. Authorization: Bearer <token> — 移动端/第三方客户端
 * 2. Cookie Session — Web 端（浏览器自动携带）
 *
 * Bearer Token 存在但无效时直接拒绝，不回退到 Cookie Session。
 *
 * @param request - 可选，传入 request 才支持 Bearer token 鉴权
 * @returns 包含 user、supabase 客户端、token 的对象
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedRequestContext> {
  const authHeader = request.headers.get('Authorization')

  if (authHeader) {
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
    if (!token) {
      throw new BizException('UNAUTHORIZED', '未登录', 401)
    }

    const supabase = await createClient(token)
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      throw new BizException('UNAUTHORIZED', '未登录', 401)
    }

    return { user: data.user, supabase }
  }

  const supabase = await createClient(undefined)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new BizException('UNAUTHORIZED', '未登录', 401)
  }

  return { user: data.user, supabase }
}

/**
 * 将 Route Handler 包装为认证请求切面。
 *
 * 在业务处理前统一验证 Bearer Token 或 Cookie Session，并注入带 RLS 身份的
 * Supabase 客户端，避免业务 Handler 自行处理认证逻辑。
 *
 * @param handler - 需要已认证用户的 Route Handler
 * @returns 标准 Next.js Route Handler
 */
export function withAuthenticatedApiHandler<TArgs extends unknown[]>(
  handler: AuthenticatedApiHandler<TArgs>,
): (request: Request, ...args: TArgs) => Promise<Response> {
  return async (request, ...args) => {
    const context = await getAuthenticatedUser(request)
    return handler(context, request, ...args)
  }
}
