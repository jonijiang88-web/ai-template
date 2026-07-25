import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, cleanExpiredEntries, clearAll } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    clearAll()
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('首次请求返回 true', () => {
    // 验证：新 key 首次请求允许通过
    expect(checkRateLimit('user:1', 5, 60_000)).toBe(true)
  })

  it('未超出阈值时返回 true', () => {
    // 验证：5次内的请求依次通过
    for (let i = 0; i < 4; i++) {
      expect(checkRateLimit('user:1', 5, 60_000)).toBe(true)
    }
  })

  it('超出阈值后返回 false', () => {
    const key = 'user:1'

    // 填满 5 次配额
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000)
    }

    // 验证：第6次请求被拒绝
    expect(checkRateLimit(key, 5, 60_000)).toBe(false)
  })

  it('不同 key 独立计数', () => {
    // 验证：user:1 和 user:2 互不影响
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user:1', 5, 60_000)
    }

    // user:1 已超限
    expect(checkRateLimit('user:1', 5, 60_000)).toBe(false)
    // user:2 不受影响
    expect(checkRateLimit('user:2', 5, 60_000)).toBe(true)
  })

  it('窗口过期后重置计数', () => {
    const key = 'user:1'

    // 填满配额（50ms 窗口）
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 50)).toBe(true)
    }

    // 验证：尚未过期，被拒绝
    expect(checkRateLimit(key, 5, 50)).toBe(false)

    // 快进 60ms，窗口过期
    vi.advanceTimersByTime(60)

    // 验证：窗口重置后允许通过
    expect(checkRateLimit(key, 5, 50)).toBe(true)
  })
})

describe('cleanExpiredEntries', () => {
  beforeEach(() => {
    clearAll()
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('清理过期的条目', () => {
    checkRateLimit('user:1', 5, 10)
    checkRateLimit('user:2', 5, 60_000) // 未过期

    // 快进 20ms，user:1 过期
    vi.advanceTimersByTime(20)
    cleanExpiredEntries()

    // user:1 应该被清理（可以重新开始计数）
    expect(checkRateLimit('user:1', 5, 60_000)).toBe(true)
  })
})
