/**
 * 内存限流 —— 单实例适用（Vercel Hobby / 单机部署）。
 *
 * 多实例场景下应替换为 Redis 等外部存储。
 * 每 key 独立窗口，重启后自动重置。
 */

const store = new Map<string, { count: number; resetAt: number }>()

/**
 * 检查指定 key 是否超出限流阈值。
 * 超出返回 false，未超出（或在新的时间窗口内）返回 true。
 *
 * @param key      限流键（如 `chat:${userId}`）
 * @param max      窗口内允许的最大请求数
 * @param windowMs 时间窗口（毫秒）
 * @returns 是否允许通过
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  // 首次请求或窗口已过期 → 重置
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  // 超出限制
  if (entry.count >= max) {
    return false
  }

  // 未超限，计数+1
  entry.count++
  return true
}

/**
 * 清理过期的限流记录，防止内存泄漏。
 * 建议定时调用（如每 5 分钟）。
 */
export function cleanExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

/**
 * 清空所有限流记录（仅测试用）。
 */
export function clearAll(): void {
  store.clear()
}
