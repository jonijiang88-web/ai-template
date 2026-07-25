/**
 * 后端翻译加载器 —— 直接从 next-intl JSON 文件中加载翻译，
 * 与服务端共享同一套多语言维护体系。
 *
 * 前端使用 next-intl 的 getTranslations / useTranslations，
 * 后端使用本文件中的 loadMessages / t 函数。
 */

import zhCN from './messages/zh-CN.json'
import en from './messages/en.json'

/** 后端支持的语言（与 next-intl 的 routing.ts 中的 locales 对应）。 */
type BackendLocale = 'zh-CN' | 'en'

/** 所有翻译消息的联合类型。 */
type Messages = Record<string, Record<string, string>>

/** 翻译消息映射。 */
const messages: Record<BackendLocale, Messages> = {
  'zh-CN': zhCN as unknown as Messages,
  en: en as unknown as Messages,
}

/**
 * 加载指定语言的全部翻译消息。
 *
 * @param locale - 语言代码（zh-CN 或 en），默认 zh-CN
 * @returns 翻译消息对象
 */
export function loadMessages(locale: string = 'zh-CN'): Messages {
  // 兼容 'zh' → 'zh-CN' 简写
  const normalized = locale === 'zh' ? 'zh-CN' : locale
  return messages[normalized as BackendLocale] ?? messages['zh-CN']
}

/**
 * 获取指定命名空间下指定 key 的翻译。
 *
 * @param locale  - 语言代码，默认 zh-CN
 * @param ns      - 命名空间（如 'ApiError', 'Email'）
 * @param key     - 翻译 key
 * @param fallback - 找不到翻译时的回退文本
 * @returns 翻译文本
 */
export function t(
  locale: string,
  ns: string,
  key: string,
  fallback: string = '',
): string {
  const msg = loadMessages(locale)
  return msg[ns]?.[key] ?? fallback
}
