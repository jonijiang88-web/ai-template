import { BizException } from './BizException'

/**
 * 支持的语言列表。
 */
const SUPPORTED_LOCALES = ['zh', 'en'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

/**
 * 从 Accept-Language 头中提取支持的语言。
 */
function detectLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return 'zh'
  // 解析 "zh-CN,zh;q=0.9,en;q=0.8" 格式
  const preferred = acceptLanguage
    .split(',')
    .map(s => s.trim().split(';')[0])
    .map(s => s.split('-')[0]) // zh-CN → zh
    .find(l => (SUPPORTED_LOCALES as readonly string[]).includes(l))
  return (preferred as Locale) ?? 'zh'
}

/**
 * 各语言错误消息字典。
 */
const errorMessages: Record<Locale, Record<string, string>> = {
  zh: {
    UNAUTHORIZED: '未登录',
    VALIDATION_ERROR: '请求参数校验失败',
    RATE_LIMITED: '请求太频繁，请稍后再试',
    INVALID_JSON: '请求体不是合法的 JSON',
    INTERNAL_ERROR: '服务暂时不可用，请稍后重试',
    MESSAGE_REJECTED: '消息包含敏感词',
  },
  en: {
    UNAUTHORIZED: 'Not authenticated',
    VALIDATION_ERROR: 'Validation failed',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    INVALID_JSON: 'Request body is not valid JSON',
    INTERNAL_ERROR: 'Service temporarily unavailable. Please try again later.',
    MESSAGE_REJECTED: 'Message contains rejected content',
  },
}

/**
 * 根据 locale 获取翻译后的错误消息。
 * 找不到翻译时回退到原始消息。
 */
function translateError(code: string, locale: Locale, fallback: string): string {
  return errorMessages[locale]?.[code] ?? fallback
}

/**
 * 从 args 中提取 Request 对象。
 * Next.js Route Handler 的约定：第一个参数为 Request。
 */
function extractRequest(args: unknown[]): Request | undefined {
  return args.find(a => a instanceof Request) as Request | undefined
}

/**
 * Next.js App Router Route Handler 的标准签名。
 * 可接收可选 request 和 params，返回 Response 或 Promise<Response>。
 */
type RouteHandler<TArgs extends unknown[] = unknown[]> = (
  ...args: TArgs
) => Response | Promise<Response>

/**
 * 高阶函数，包装任意异步 Route Handler，统一处理业务异常与未知异常。
 *
 * 根据请求的 Accept-Language 头自动切换错误消息语言。
 *
 * - 捕获 {@link BizException}：返回 `{ error: { code, message } }` 及其 HTTP status。
 * - 捕获未知异常：在服务端 `console.error` 后返回 500。
 * - 不泄漏原始错误细节给客户端。
 *
 * @param handler - 原始的异步 Route Handler
 * @returns 被包装后的 Route Handler
 */
export function withApiErrorHandler<TArgs extends unknown[]>(
  handler: RouteHandler<TArgs>,
): RouteHandler<TArgs> {
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (err) {
      // 从请求头检测用户语言
      const req = extractRequest(args)
      const locale = detectLocale(req?.headers.get('Accept-Language') ?? undefined)

      if (err instanceof BizException) {
        return Response.json(
          {
            error: {
              code: err.code,
              message: translateError(err.code, locale, err.message),
            },
          },
          { status: err.status },
        )
      }

      // 未知异常：记录日志，不泄漏原始信息
      console.error('[withApiErrorHandler] 未捕获的异常:', err)
      return Response.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: translateError('INTERNAL_ERROR', locale, '服务暂时不可用，请稍后重试'),
          },
        },
        { status: 500 },
      )
    }
  }
}
