/**
 * 服务端 locale 工具 —— 从 HTTP 请求中检测用户语言偏好。
 */

/** 支持的语言列表。 */
const SUPPORTED_LOCALES = ['zh', 'en'] as const

/** 支持的 locale 联合类型。 */
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/**
 * 从 Request 的 Accept-Language 头中检测用户语言。
 *
 * 解析 "zh-CN,zh;q=0.9,en;q=0.8" 格式，取第一个支持的语言。
 * 无匹配时返回默认值。
 *
 * @param request      - 可选的 HTTP Request 对象
 * @param defaultLocale - 未检测到时的回退语言（默认 zh）
 * @returns 检测到的语言
 */
export function detectLocaleFromRequest(
  request?: Request,
  defaultLocale: Locale = 'zh',
): Locale {
  const acceptLanguage = request?.headers.get('Accept-Language')
  if (!acceptLanguage) return defaultLocale

  const preferred = acceptLanguage
    .split(',')
    .map(s => s.trim().split(';')[0])
    .map(s => s.split('-')[0])
    .find(l => (SUPPORTED_LOCALES as readonly string[]).includes(l))

  return (preferred as Locale) ?? defaultLocale
}
