import { describe, expect, it } from 'vitest'
import { hasLocale, routing } from './routing'

describe('国际化路由配置', () => {
  it('以中文作为默认语言，并支持英文', () => {
    // 验证：默认 locale 为中文，保持现有中文用户 URL 不变
    expect(routing.defaultLocale).toBe('zh-CN')
    // 验证：英文是受支持的 locale
    expect(routing.locales).toContain('en')
  })

  it('仅接受已配置的 locale', () => {
    // 验证：中文 locale 通过校验
    expect(hasLocale('zh-CN')).toBe(true)
    // 验证：未配置 locale 不通过校验
    expect(hasLocale('ja')).toBe(false)
  })
})
