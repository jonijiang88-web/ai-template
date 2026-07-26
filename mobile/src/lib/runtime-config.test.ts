import { describe, expect, it } from 'vitest'
import { getRuntimeConfig } from './runtime-config'

describe('getRuntimeConfig', () => {
  it('返回内置的移动端公开配置', () => {
    const config = getRuntimeConfig()

    // 验证：使用内置 Supabase URL
    expect(config.supabaseUrl).toBe('https://auuhpxgbaniywinqfoah.supabase.co')
    // 验证：使用内置 Supabase 发布密钥
    expect(config.supabasePublishableKey).toBe('sb_publishable_bX1Nb2IaGuG_ChR5-kZfCQ_T4Ev2wSb')
    // 验证：使用内置生产 API 地址
    expect(config.apiBaseUrl).toBe('https://ai-template.jonijiang.cc')
  })

  it('优先使用本地环境变量覆盖公开配置', () => {
    const config = getRuntimeConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://local.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-publishable-key',
      EXPO_PUBLIC_API_BASE_URL: 'http://192.168.1.100:3000',
    })

    // 验证：本地 Supabase URL 可覆盖内置地址
    expect(config.supabaseUrl).toBe('https://local.supabase.co')
    // 验证：本地发布密钥可覆盖内置密钥
    expect(config.supabasePublishableKey).toBe('local-publishable-key')
    // 验证：本地 API 地址可覆盖生产地址
    expect(config.apiBaseUrl).toBe('http://192.168.1.100:3000')
  })
})
