import { describe, it, expect, vi, beforeEach } from 'vitest'

// 使用 vi.hoisted 确保 mock 变量在 vi.mock 提升前已定义
const { mockAuth, mockGetMessages, mockSendMessage } = vi.hoisted(() => {
  return {
    mockAuth: vi.fn(),
    mockGetMessages: vi.fn(),
    mockSendMessage: vi.fn(),
  }
})

// 模拟认证模块
vi.mock('../../_auth/auth', () => ({
  auth: mockAuth,
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

describe('app/api/chat 路由', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /', () => {
    it('未登录时返回 401 及结构化错误', async () => {
      // 模拟 auth() 返回 null（未登录）
      mockAuth.mockResolvedValue(null)

      const res = await GET()

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      expect(body).toEqual({
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      })
    })

    it('已登录但缺少邮箱时返回 401', async () => {
      // 模拟 auth() 返回有用户但无 email
      mockAuth.mockResolvedValue({ user: { name: 'test' } })

      const res = await GET()

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      // 验证：返回 UNAUTHORIZED 错误
      const body = await res.json()
      expect(body).toEqual({
        error: { code: 'UNAUTHORIZED', message: '用户邮箱不可用' },
      })
      // 验证：getMessages 未被调用（提前返回）
      expect(mockGetMessages).not.toHaveBeenCalled()
    })

    it('已登录且带邮箱时通过 email 查询消息列表', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })
      // 模拟 getMessages 返回消息数组
      const fakeMessages = [{ id: 1, userId: 'test@demo.local', content: '你好' }]
      mockGetMessages.mockResolvedValue(fakeMessages)

      const res = await GET()

      // 验证：状态码为 200
      expect(res.status).toBe(200)
      // 验证：getMessages 被调用时传入了用户的 email 作为 userId
      expect(mockGetMessages).toHaveBeenCalledWith('test@demo.local')
      // 验证：返回的 JSON 包含 messages 字段
      const body = await res.json()
      expect(body).toEqual({ messages: fakeMessages })
    })
  })

  describe('POST /', () => {
    it('未登录时返回 401 及结构化错误', async () => {
      // 模拟 auth() 返回 null（未登录）
      mockAuth.mockResolvedValue(null)

      const res = await POST(createRequest({ message: 'hello' }))

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      expect(body).toEqual({
        error: { code: 'UNAUTHORIZED', message: '未登录' },
      })
    })

    it('已登录但缺少邮箱时返回 401', async () => {
      // 模拟 auth() 返回有用户但无 email
      mockAuth.mockResolvedValue({ user: { name: 'test' } })

      const res = await POST(createRequest({ message: 'hello' }))

      // 验证：状态码为 401
      expect(res.status).toBe(401)
      // 验证：返回 UNAUTHORIZED 错误
      const body = await res.json()
      expect(body).toEqual({
        error: { code: 'UNAUTHORIZED', message: '用户邮箱不可用' },
      })
      // 验证：sendMessage 未被调用（提前返回）
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('非法 JSON 请求体返回 400 及结构化错误', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })

      const res = await POST(createInvalidJsonRequest())

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      expect(body).toEqual({
        error: { code: 'INVALID_JSON', message: '请求体不是合法的 JSON' },
      })
    })

    it('缺失 message 字段时返回 400 及结构化错误', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })

      const res = await POST(createRequest({}))

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'message 必须为 1-4000 个字符',
        },
      })
    })

    it('message 为空字符串（或仅空白字符）时返回 400 及结构化错误', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })

      const res = await POST(createRequest({ message: '   ' }))

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'message 必须为 1-4000 个字符',
        },
      })
    })

    it('message 超过 4000 字符时返回 400 及结构化错误', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })

      const res = await POST(createRequest({ message: 'x'.repeat(4001) }))

      // 验证：状态码为 400
      expect(res.status).toBe(400)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'message 必须为 1-4000 个字符',
        },
      })
    })

    it('合法消息时调用 sendMessage 并返回 reply', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })
      // 模拟 sendMessage 返回回复内容
      mockSendMessage.mockResolvedValue('你说了: "hello"')

      const res = await POST(createRequest({ message: 'hello' }))

      // 验证：状态码为 200
      expect(res.status).toBe(200)
      // 验证：sendMessage 被调用时传入了用户 email 和消息内容
      expect(mockSendMessage).toHaveBeenCalledWith('test@demo.local', 'hello')
      // 验证：返回的 JSON 包含 reply 字段且值为预期的回复内容
      const body = await res.json()
      expect(body).toEqual({ reply: '你说了: "hello"' })
    })

    it('服务层抛出 BizException 时返回指定状态码与编码', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })
      // 模拟 sendMessage 抛出 BizException（模拟业务拒绝）
      const { BizException } = await import('../../_lib/BizException')
      mockSendMessage.mockRejectedValue(
        new BizException('MESSAGE_REJECTED', '消息包含敏感词', 422),
      )

      const res = await POST(createRequest({ message: 'badword' }))

      // 验证：状态码为 422
      expect(res.status).toBe(422)
      // 验证：返回结构化 JSON { error: { code, message } }
      const body = await res.json()
      expect(body).toEqual({
        error: { code: 'MESSAGE_REJECTED', message: '消息包含敏感词' },
      })
    })

    it('服务层抛出未知异常时返回 500 且不泄漏原始错误', async () => {
      // 模拟 auth() 返回已登录用户（含 email）
      mockAuth.mockResolvedValue({ user: { name: 'test', email: 'test@demo.local' } })
      // 模拟 sendMessage 抛出未知 Error
      mockSendMessage.mockRejectedValue(new Error('数据库连接超时'))

      const res = await POST(createRequest({ message: 'hello' }))

      // 验证：状态码为 500
      expect(res.status).toBe(500)
      // 验证：返回通用错误结构，不包含原始错误消息
      const body = await res.json()
      expect(body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务暂时不可用，请稍后重试',
        },
      })
      // 验证：原始错误消息未被泄漏
      expect(body.error.message).not.toContain('数据库连接超时')
    })
  })
})
