import { describe, expect, it } from 'vitest'
import { canSendChatMessage } from './chat-state'

describe('canSendChatMessage', () => {
  it('历史加载期间禁止发送消息', () => {
    // 验证：尚未加载历史时不会允许提交消息
    expect(canSendChatMessage('你好', true, false)).toBe(false)
  })

  it('历史加载完成且未流式响应时允许发送有效消息', () => {
    // 验证：有效输入在空闲状态下可以提交
    expect(canSendChatMessage('你好', false, false)).toBe(true)
    // 验证：纯空白输入不会被提交
    expect(canSendChatMessage('   ', false, false)).toBe(false)
  })
})
