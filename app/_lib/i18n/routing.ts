import { defineRouting } from 'next-intl/routing'

/** 支持的应用语言列表。 */
export const locales = ['zh-CN', 'en'] as const

/** 国际化路由配置：默认中文保持无前缀 URL，英文使用 /en 前缀。 */
export const routing = defineRouting({
  locales,
  defaultLocale: 'zh-CN',
  localePrefix: 'as-needed',
})

/** 应用支持的 locale 联合类型。 */
export type AppLocale = (typeof locales)[number]

/**
 * 判断 URL locale 是否在应用支持范围内。
 *
 * @param locale - 待校验的 locale 字符串
 * @returns 是否为受支持的应用 locale
 */
export function hasLocale(locale: string | undefined): locale is AppLocale {
  return locales.some((supportedLocale) => supportedLocale === locale)
}
