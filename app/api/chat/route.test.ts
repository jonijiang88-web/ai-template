import { describe, it, expect, vi, beforeEach } from 'vitest'

// 使用 vi.hoisted 确保 mock 变量在 vi.mock 提升前已定义
const { mockCreateServerClient, mockGetUser, mockGetMessages, mockSaveMessages } = vi.hoisted(() => {
  return {
    mockCreateServerClient: vi.fn(),
    mockGetUser: vi.fn(),
    mockGetMessages: vi.fn(),
    mockSaveMessages: vi.fn(),
  }
})

// 模拟 AI SDK 的 streamText
const { mockStreamText, mockCreateUIMessageStreamResponse, mockToUIMessageStream } = vi.hoisted(() => {
  // 创建一个可读流用于模拟 stream
  const mockStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('data: {"type":"text","text":"Hello!"}\n\n'))
      controller.close()
    },
  })

  return {
    mockStreamText: vi.fn().mockReturnValue({ stream: mockStream }),
    mockToUIMessageStream: vi.fn().mockReturnValue(mockStream),
    mockCreateUIMessageStreamResponse: vi.fn().mockReturnValue(
      new Response(mockStream, {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    ),
  }
})

// 模拟 AI SDK
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual as object,
    streamText: mockStreamText,
    createUIMessageStreamResponse: mockCreateUIMessageStreamResponse,
    toUIMessageStream: mockToUIMessageStream,
  }
})

// 模拟 DeepSeek 提供者
vi.mock('@ai-sdk/deepseek', () => ({
  deepSeek: vi.fn().mockReturnValue({}),
}))

// 模拟 Supabase 服务端客户端创建
vi.mock('@/app/_lib/supabase/server', () => ({
  createClient: mockCreateServerClient,
}))

// 模拟聊天服务模块
vi.mock('../../_service/chat', () => ({
  getMessages: mockGetMessages,
  saveMessages: mockSaveMessages,
  toUIMessage: vi.fn(r => ({
    id: r.id,
    role: r.role,
    parts: [{ type: 'text', text: r.content }],
  })),
}))

import { GET, POST } from './route'

/** 创建一个模拟的 POST Request 对象（AI SDK useChat 格式） */
function createChatRequest(messages: Array<{ role: string; content: string }>): Request {
  const uiMessages = messages.map((m, i) => ({
    id: `msg-${i}`,
    role: m.role,
    parts: [{ type: 'text' as const, text: m.content }],
  }))
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: uiMessages }),
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
      mockCreateServerClient.mockResolvedValue(createMockSupabaseClient(null))

      const res = await GET()

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      const body = await res.json()
      // 验证：未登录响应包含标准错误编码和文案
      expect(body).toEqual({
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      })
    })

    it('已登录时查询消息列表并转为 UIMessage 格式', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )
      const fakeRecords = [
        { id: '1', user_id: 'user-uuid', role: 'user', content: '你好', created_at: '2026-01-01T00:00:00Z' },
      ]
      mockGetMessages.mockResolvedValue(fakeRecords)

      const res = await GET()

      // 验证：状态码为 200
      expect(res.status).toBe(200)
      // 验证：getMessages 被调用时传入 supabase 客户端和 user.id
      expect(mockGetMessages).toHaveBeenCalledWith(
        expect.objectContaining({ auth: { getUser: mockGetUser } }),
        'user-uuid',
      )
      const body = await res.json()
      // 验证：响应包含 messages 数组，且每条消息有 parts 字段（UIMessage 格式）
      expect(body).toHaveProperty('messages')
      expect(Array.isArray(body.messages)).toBe(true)
      if (body.messages.length > 0) {
        // 验证：每条消息包含 UIMessage 必备的 parts 字段
        expect(body.messages[0]).toHaveProperty('parts')
      }
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

      const res = await POST(createChatRequest([{ role: 'user', content: 'hello' }]))

      // 验证：状态码为 401
      expect(res.status).toBe(401)
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
      const body = await res.json()
      // 验证：非法 JSON 响应使用对应错误编码
      expect(body).toEqual({
        error: { code: 'INVALID_JSON', message: '请求体不是合法的 JSON' },
      })
    })

    it('缺失 messages 字段时返回 400', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      const body = await res.json()
      // 验证：缺失 messages 时返回 VALIDATION_ERROR
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求参数校验失败',
        },
      })
    })

    it('空 messages 数组时返回 400', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const res = await POST(createChatRequest([]))

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      const body = await res.json()
      // 验证：空数组时返回 VALIDATION_ERROR
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求参数校验失败',
        },
      })
    })

    it('合法消息时调用 streamText 并返回流式响应', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const res = await POST(createChatRequest([{ role: 'user', content: 'hello' }]))

      // 验证：streamText 被调用
      expect(mockStreamText).toHaveBeenCalledTimes(1)
      // 验证：createUIMessageStreamResponse 被调用
      expect(mockCreateUIMessageStreamResponse).toHaveBeenCalledTimes(1)
      // 验证：返回流式响应
      expect(res.headers.get('Content-Type')).toBe('text/event-stream')
      // 验证：状态码为 200
      expect(res.status).toBe(200)
    })

    it('BizException 在流式路径前抛出时返回指定状态码', async () => {
      // mock auth 失败
      mockCreateServerClient.mockResolvedValue(createMockSupabaseClient(null))

      const res = await POST(createChatRequest([{ role: 'user', content: 'hello' }]))

      // 验证：状态码为 401（在 streamText 调用前就拒绝了）
      expect(res.status).toBe(401)
      // 验证：streamText 未被调用（未到达流式路径）
      expect(mockStreamText).not.toHaveBeenCalled()
    })

    it('messages 中包含历史对话时仍能正常调用 streamText', async () => {
      mockCreateServerClient.mockResolvedValue(
        createMockSupabaseClient({ id: 'user-uuid', email: 'test@example.com' }),
      )

      const res = await POST(createChatRequest([
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'What is AI?' },
      ]))

      // 验证：streamText 被调用（包含全部历史消息）
      expect(mockStreamText).toHaveBeenCalledTimes(1)
      // 验证：返回流式响应
      expect(res.status).toBe(200)
    })
  })
})
