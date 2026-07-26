/**
 * 生成唯一 ID —— 兼容 React Native（Hermes 无 crypto.randomUUID）。
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // 降级：使用时间戳 + 随机数
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
