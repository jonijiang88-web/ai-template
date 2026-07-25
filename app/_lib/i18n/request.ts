import { getRequestConfig } from 'next-intl/server'
import { hasLocale, routing } from './routing'

/** 根据路由 locale 加载当前请求对应的翻译字典。 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale
  const locale = hasLocale(requestedLocale)
    ? requestedLocale
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
