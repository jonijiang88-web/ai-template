import { describe, it, expect, vi, beforeEach } from 'vitest'

// 使用 vi.hoisted 确保 mock 变量在 vi.mock 提升前已定义
const { mockCreateServerClient, mockGetUser, mockGetMessages, mockSendMessage } = vi.hoisted(() => {
  return {
    mockCreateServerClient: vi.fn(),
    mockGetUser: vi.fn(),
    mockGetMessages: vi.fn(),
    mockSendMessage: vi.fn(),
  }
})

// 模拟 Supabase 服务端客户端创建
vi.mock('@/app/_lib/supabase/server', () => ({
  createClient: mockCreateServerClient,
}))

// 模拟聊天服务模块
vi.mock('../../_service/chat', () => ({
  getMessages: mockGetMessages,
  sendMessage: mockSendMessage,
}))

import { GET, POST } from './route'

/** 创建一个模拟的 POST Request 对象 */
function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** 创建一个不合法的 JSON 请求体 Request 对象 */
function createInvalidJsonRequest(): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not-json',
  })
}

/** 创建模拟的 Supabase 客户端，模拟 getUser 方法 */
function createMockSupabaseClient(user: { id: string; email?: string } | null) {
  const result = user
    ? { data: { user }, error: null }
    : { data: { user: null }, error: new Error('Not authenticated') }

  mockGetUser.mockResolvedValue(result)

  return {
    auth: { getUser: mockGetUser },
    from: vi.fn(),
  }
}

describe('app/api/chat 路由', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /', () => {
    it('未登录时返回 401 及结构化错误', async () => {
      // 模拟 createClient 返回模拟客户端（无用户）
      mockCreateServerClient.mockResolvedValue(createMockSupabaseClient(null))

      const res = await GET()

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      // 验证：未登录响应包含标准错误编码和文案
      expect(body).toEqual({
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      })
    })

    it('已登录时通过 auth.uid() 查询消息列表', async () => {
      // 模拟 createClient 返回模拟客户端（已登录用户）
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )
      // 模拟 getMessages 返回消息数组
      const fakeMessages = [
        { id: '1', user_id: 'user-uuid', role: 'user', content: '你好', created_at: '2026-01-01T00:00:00Z' },
      ]
      mockGetMessages.mockResolvedValue(fakeMessages)

      const res = await GET()

      // 验证：状态码为 200
      expect(res.status).toBe(200)
      // 验证：getMessages 被调用时传入 supabase 客户端和 user.id（而非 email）
      expect(mockGetMessages).toHaveBeenCalledWith(
        expect.objectContaining({ auth: { getUser: mockGetUser } }),
        'user-uuid',
      )
      // 验证：返回的 JSON 包含 messages 字段
      const body = await res.json()
      // 验证：响应消息列表等于服务层返回值
      expect(body).toEqual({ messages: fakeMessages })
    })

    it('getUser 返回 error 时视为未登录', async () => {
      mockCreateServerClient.mockResolvedValue(createMockSupabaseClient(null))

      const res = await GET()

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      // 验证：getMessages 未被调用（提前返回）
      expect(mockGetMessages).not.toHaveBeenCalled()
    })
  })

  describe('POST /', () => {
    it('未登录时返回 401 及结构化错误', async () => {
      mockCreateServerClient.mockResolvedValue(createMockSupabaseClient(null))

      const res = await POST(createRequest({ message: 'hello' }))

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      // 验证：返回结构化 JSON
      const body = await res.json()
      // 验证：未登录响应包含标准错误编码和文案
      expect(body).toEqual({
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      })
    })

    it('非法 JSON 请求体返回 400 及结构化错误', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const res = await POST(createInvalidJsonRequest())

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      // 验证：返回结构化 JSON
      const body = await res.json()
      // 验证：非法 JSON 响应使用对应错误编码
      expect(body).toEqual({
        error: { code: 'INVALID_JSON', message: '请求体不是合法的 JSON' },
      })
    })

    it('缺失 message 字段时返回 400 及结构化错误', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const res = await POST(createRequest({}))

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      // 验证：返回 VALIDATION_ERROR
      const body = await res.json()
      // 验证：缺失 message 时返回统一校验错误
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'message 必须为 1-4000 个字符',
        },
      })
    })

    it('message 为空字符串（或仅空白）时返回 400', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const res = await POST(createRequest({ message: '   ' }))

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      const body = await res.json()
      // 验证：空白 message 返回统一校验错误
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'message 必须为 1-4000 个字符',
        },
      })
    })

    it('message 超过 4000 字符时返回 400', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const res = await POST(createRequest({ message: 'x'.repeat(4001) }))

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      const body = await res.json()
      // 验证：超长 message 返回统一校验错误
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'message 必须为 1-4000 个字符',
        },
      })
    })

    it('合法消息时调用 sendMessage 并返回 reply', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )
      mockSendMessage.mockResolvedValue('You said: "hello"')

      const res = await POST(createRequest({ message: 'hello' }))

      // 验证：状态码为 200
      expect(res.status).toBe(200)
      // 验证：sendMessage 被调用时传入 user.id
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ auth: { getUser: mockGetUser } }),
        'user-uuid',
        'hello',
      )
      // 验证：返回的 JSON 包含 reply
      const body = await res.json()
      // 验证：成功响应返回服务层生成的回复
      expect(body).toEqual({ reply: 'You said: "hello"' })
    })

    it('服务层抛出 BizException 时返回指定状态码', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )
      const { BizException } = await import('../../_lib/BizException')
      mockSendMessage.mockRejectedValue(
        new BizException('MESSAGE_REJECTED', '消息包含敏感词', 422),
      )

      const res = await POST(createRequest({ message: 'badword' }))

      // 验证：状态码为 422
      expect(res.status).toBe(422)
      const body = await res.json()
      // 验证：业务异常的编码和文案被完整保留
      expect(body).toEqual({
        error: { code: 'MESSAGE_REJECTED', message: '消息包含敏感词' },
      })
    })

    it('服务层抛出未知异常时返回 500 且不泄漏原始错误', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )
      mockSendMessage.mockRejectedValue(new Error('Supabase 连接超时'))

      const res = await POST(createRequest({ message: 'hello' }))

      // 验证：状态码为 500
      expect(res.status).toBe(500)
      const body = await res.json()
      // 验证：未知异常转换为不暴露内部信息的标准响应
      expect(body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务暂时不可用，请稍后重试',
        },
      })
      // 验证：原始错误消息未被泄漏
      expect(body.error.message).not.toContain('Supabase 连接超时')
    })
  })
})
