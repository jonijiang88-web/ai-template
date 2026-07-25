import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getMessages, sendMessage } from './chat'

/**
 * 模拟的 Supabase 客户端类型，暴露内部 mock 方法供断言使用。
 */
interface MockSupabaseClient extends Pick<SupabaseClient, 'from'> {
  _mockSelect: ReturnType<typeof vi.fn>
  _mockEq: ReturnType<typeof vi.fn>
  _mockOrder: ReturnType<typeof vi.fn>
  _mockInsert: ReturnType<typeof vi.fn>
}

/**
 * 创建模拟的 Supabase 客户端，支持链式调用（from → select/insert → eq → order）。
 */
function createMockSupabase(): MockSupabaseClient {
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockOrder = vi.fn()
  const mockInsert = vi.fn()

  const mockFrom = vi.fn().mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
  }))

  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ order: mockOrder })
  mockOrder.mockResolvedValue({ data: null, error: null })

  mockInsert.mockResolvedValue({ data: null, error: null })

  return {
    from: mockFrom,
    _mockSelect: mockSelect,
    _mockEq: mockEq,
    _mockOrder: mockOrder,
    _mockInsert: mockInsert,
  }
}

describe('chat 服务', () => {
  describe('getMessages', () => {
    it('按指定 userId 查询 messages 表', async () => {
      const supabase = createMockSupabase()
      // 模拟返回两条消息
      const fakeMessages = [
        { id: '1', user_id: 'user-uuid', role: 'user', content: 'hi', created_at: '2026-01-01T00:00:00Z' },
        { id: '2', user_id: 'user-uuid', role: 'assistant', content: 'You said: "hi"', created_at: '2026-01-01T00:00:01Z' },
      ]
      supabase._mockOrder.mockResolvedValue({ data: fakeMessages, error: null })

      const result = await getMessages(supabase as unknown as SupabaseClient, 'user-uuid')

      // 验证：from 被调用时表名为 messages
      expect(supabase.from).toHaveBeenCalledWith('messages')
      // 验证：select 被调用时查询所有列
      expect(supabase._mockSelect).toHaveBeenCalledWith('*')
      // 验证：按 user_id 过滤
      expect(supabase._mockEq).toHaveBeenCalledWith('user_id', 'user-uuid')
      // 验证：按 created_at 升序排列
      expect(supabase._mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
      // 验证：返回的消息列表与 mock 数据一致
      expect(result).toEqual(fakeMessages)
    })

    it('查询结果为空时返回空数组', async () => {
      const supabase = createMockSupabase()
      supabase._mockOrder.mockResolvedValue({ data: [], error: null })

      const result = await getMessages(supabase as unknown as SupabaseClient, 'other-user')

      // 验证：返回空数组而非 null 或 undefined
      expect(result).toEqual([])
    })

    it('Supabase 查询错误时抛出异常', async () => {
      const supabase = createMockSupabase()
      supabase._mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') })

      // 验证：getMessages 抛出错误，不吞异常
      await expect(getMessages(supabase as unknown as SupabaseClient, 'user-uuid')).rejects.toThrow('DB error')
    })

    it('不同 userId 查询互不干扰', async () => {
      const supabase = createMockSupabase()
      supabase._mockOrder.mockResolvedValue({ data: [], error: null })

      await getMessages(supabase as unknown as SupabaseClient, 'alice-uuid')
      await getMessages(supabase as unknown as SupabaseClient, 'bob-uuid')

      // 验证：两次 eq 调用传入的 userId 不同
      expect(supabase._mockEq).toHaveBeenNthCalledWith(1, 'user_id', 'alice-uuid')
      expect(supabase._mockEq).toHaveBeenNthCalledWith(2, 'user_id', 'bob-uuid')
    })
  })

  describe('sendMessage', () => {
    it('插入 user 和 assistant 两条消息', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: null })

      const reply = await sendMessage(supabase as unknown as SupabaseClient, 'user-uuid', 'hello')

      // 验证：from 被调用时表名为 messages
      expect(supabase.from).toHaveBeenCalledWith('messages')
      // 验证：insert 调用了一次
      expect(supabase._mockInsert).toHaveBeenCalledTimes(1)
      // 验证：insert 参数包含 user 和 assistant 两条记录
      const insertArg = supabase._mockInsert.mock.calls[0][0]
      // 验证：insert 参数仅包含两条消息记录
      expect(insertArg).toHaveLength(2)
      // 验证：第一条为 user 角色
      expect(insertArg[0]).toMatchObject({ user_id: 'user-uuid', role: 'user', content: 'hello' })
      // 验证：第二条为 assistant 角色
      expect(insertArg[1]).toMatchObject({ user_id: 'user-uuid', role: 'assistant' })
      // 验证：回复内容正确
      expect(reply).toBe('You said: "hello"')
    })

    it('userId 统一绑定，不接受客户端传入', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: null })

      await sendMessage(supabase as unknown as SupabaseClient, 'user-uuid', 'test')

      // 验证：两条记录的 user_id 均为服务端提供的 userId
      const insertArg = supabase._mockInsert.mock.calls[0][0]
      // 验证：第一条记录绑定服务端提供的 userId
      expect(insertArg[0].user_id).toBe('user-uuid')
      // 验证：第二条记录绑定服务端提供的 userId
      expect(insertArg[1].user_id).toBe('user-uuid')
    })

    it('不同 userId 发送消息时各自绑定', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: null })

      await sendMessage(supabase as unknown as SupabaseClient, 'alice-uuid', 'hi')
      await sendMessage(supabase as unknown as SupabaseClient, 'bob-uuid', 'hey')

      // 验证：第一次 insert 使用 alice-uuid
      expect(supabase._mockInsert.mock.calls[0][0][0].user_id).toBe('alice-uuid')
      // 验证：第二次 insert 使用 bob-uuid
      expect(supabase._mockInsert.mock.calls[1][0][0].user_id).toBe('bob-uuid')
    })

    it('Supabase 插入错误时抛出异常', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: new Error('Insert failed') })

      // 验证：sendMessage 抛出错误，不吞异常
      await expect(sendMessage(supabase as unknown as SupabaseClient, 'user-uuid', 'hello')).rejects.toThrow('Insert failed')
    })

    it('不同 userId 发送消息返回各自定制的回复', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: null })

      const reply1 = await sendMessage(supabase as unknown as SupabaseClient, 'alice-uuid', 'hi')
      const reply2 = await sendMessage(supabase as unknown as SupabaseClient, 'bob-uuid', 'hey')

      // 验证：回复内容包含各自的原始消息
      expect(reply1).toBe('You said: "hi"')
      // 验证：第二次调用的回复内容包含对应原始消息
      expect(reply2).toBe('You said: "hey"')
    })
  })
})
