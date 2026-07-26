import { describe, expect, it } from 'vitest'
import { getRuntimeConfig } from './runtime-config'

describe('getRuntimeConfig', () => {
  it('返回完整的移动端运行时配置', () => {
    const config = getRuntimeConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com',
    })

    // 验证：读取 Supabase URL
    expect(config.supabaseUrl).toBe('https://example.supabase.co')
    // 验证：读取 Supabase 发布密钥
    expect(config.supabasePublishableKey).toBe('publishable-key')
    // 验证：读取生产 API 地址
    expect(config.apiBaseUrl).toBe('https://api.example.com')
  })

  it('缺少必要配置时抛出可诊断错误', () => {
    // 验证：缺失 Supabase URL 不会被静默降级为空字符串
    expect(() => getRuntimeConfig({})).toThrow('EXPO_PUBLIC_SUPABASE_URL')
    // 验证：缺失发布密钥会明确指出对应变量
    expect(() => getRuntimeConfig({ EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' }))
      .toThrow('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    // 验证：缺失 API 地址会明确指出对应变量
    expect(() => getRuntimeConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    })).toThrow('EXPO_PUBLIC_API_BASE_URL')
  })
})
