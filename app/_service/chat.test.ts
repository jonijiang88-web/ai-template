import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getMessages, saveMessages, toUIMessage } from './chat'

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

/**
 * 创建测试用的 DB 消息记录。
 */
function makeRecord(overrides: Partial<{
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}> = {}) {
  return {
    id: 'msg-1',
    user_id: 'user-uuid',
    role: 'user' as const,
    content: 'hello',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('chat 服务', () => {
  describe('toUIMessage', () => {
    it('将 DB 记录转为 UIMessage 格式', () => {
      const record = makeRecord({ id: 'abc', role: 'assistant', content: 'Hello!' })

      const result = toUIMessage(record)

      // 验证：id 保持一致
      expect(result.id).toBe('abc')
      // 验证：role 保持一致
      expect(result.role).toBe('assistant')
      // 验证：parts 包含一个 text 类型的 part
      expect(result.parts).toEqual([{ type: 'text', text: 'Hello!' }])
    })
  })

  describe('getMessages', () => {
    it('按指定 userId 查询 messages 表', async () => {
      const supabase = createMockSupabase()
      const fakeMessages = [
        makeRecord({ id: '1', role: 'user', content: 'hi' }),
        makeRecord({ id: '2', role: 'assistant', content: 'You said: "hi"' }),
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

  describe('saveMessages', () => {
    it('插入 user 和 assistant 两条消息', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: null })

      await saveMessages(supabase as unknown as SupabaseClient, 'user-uuid', 'hello', 'Hi there!')

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
      expect(insertArg[1]).toMatchObject({ user_id: 'user-uuid', role: 'assistant', content: 'Hi there!' })
    })

    it('userId 统一绑定，不接受客户端传入', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: null })

      await saveMessages(supabase as unknown as SupabaseClient, 'user-uuid', 'test', 'reply')

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

      await saveMessages(supabase as unknown as SupabaseClient, 'alice-uuid', 'hi', 'hello alice')
      await saveMessages(supabase as unknown as SupabaseClient, 'bob-uuid', 'hey', 'hello bob')

      // 验证：第一次 insert 使用 alice-uuid
      expect(supabase._mockInsert.mock.calls[0][0][0].user_id).toBe('alice-uuid')
      // 验证：第二次 insert 使用 bob-uuid
      expect(supabase._mockInsert.mock.calls[1][0][0].user_id).toBe('bob-uuid')
    })

    it('Supabase 插入错误时不抛出异常（仅 console.error）', async () => {
      const supabase = createMockSupabase()
      supabase._mockInsert.mockResolvedValue({ data: null, error: new Error('Insert failed') })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // 验证：saveMessages 不会抛出错误（吞异常，仅打日志）
      await expect(
        saveMessages(supabase as unknown as SupabaseClient, 'user-uuid', 'hello', 'reply'),
      ).resolves.toBeUndefined()
      // 验证：console.error 被调用
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
