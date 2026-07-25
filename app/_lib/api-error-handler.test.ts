import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BizException } from './BizException'
import { withApiErrorHandler } from './api-error-handler'

describe('withApiErrorHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时原样返回 Response', async () => {
    // 验证：handler 正常返回 Response 时，包装器透传该 Response
    const handler = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    const wrapped = withApiErrorHandler(handler)
    const res = await wrapped()
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toBe('ok')
  })

  it('捕获 BizException 并返回结构化 JSON 错误及对应 status', async () => {
    // 验证：BizException 被捕获后返回 { error: { code, message } } 及对应的 status
    const handler = vi.fn().mockRejectedValue(
      new BizException('AUTH_FAILED', '认证失败', 401),
    )
    const wrapped = withApiErrorHandler(handler)
    const res = await wrapped()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: { code: 'AUTH_FAILED', message: '认证失败' } })
  })

  it('捕获 BizException（403）并返回对应状态码与结构', async () => {
    // 验证：403 的 BizException 同样被正确转换
    const handler = vi.fn().mockRejectedValue(
      new BizException('FORBIDDEN', '无权限', 403),
    )
    const wrapped = withApiErrorHandler(handler)
    const res = await wrapped()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: { code: 'FORBIDDEN', message: '无权限' } })
  })

  it('捕获未知异常时在服务端 console.error 后返回 500', async () => {
    // 验证：非 BizException 的未知错误被 console.error 记录，并返回 500 结构化错误
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const originalError = new Error('数据库连接失败')
    const handler = vi.fn().mockRejectedValue(originalError)
    const wrapped = withApiErrorHandler(handler)
    const res = await wrapped()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务暂时不可用，请稍后重试',
      },
    })
    // 验证：原始错误被 console.error 记录（不泄漏给客户端）
    expect(consoleSpy).toHaveBeenCalledWith(
      '[withApiErrorHandler] 未捕获的异常:',
      originalError,
    )
  })

  it('捕获未知异常时不泄漏原始错误消息', async () => {
    // 验证：原始错误的 message 不会出现在响应体中
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = vi.fn().mockRejectedValue(new Error('数据库连接失败'))
    const wrapped = withApiErrorHandler(handler)
    const res = await wrapped()
    const body = await res.json()
    expect(body.error.message).not.toContain('数据库连接失败')
    expect(body.error.code).toBe('INTERNAL_ERROR')
    consoleSpy.mockRestore()
  })

  it('透传 handler 的 request 参数', async () => {
    // 验证：wrapped 函数将 request 参数原样传递给原始 handler
    const handler = vi.fn().mockResolvedValue(new Response('ok'))
    const wrapped = withApiErrorHandler(handler)
    const req = new Request('http://localhost/test')
    await wrapped(req)
    expect(handler).toHaveBeenCalledWith(req)
  })

  it('透传 handler 的 request 和 params 参数', async () => {
    // 验证：wrapped 函数将两个参数都传递
    const handler = vi.fn().mockResolvedValue(new Response('ok'))
    const wrapped = withApiErrorHandler(handler)
    const req = new Request('http://localhost/test')
    const params = { id: '1' }
    await wrapped(req, params)
    expect(handler).toHaveBeenCalledWith(req, params)
  })

  it('无 Accept-Language 时默认返回中文错误消息', async () => {
    // 验证：没有 Accept-Language 头时使用中文
    const handler = vi.fn().mockRejectedValue(
      new BizException('RATE_LIMITED', '请求太频繁，请稍后再试', 429),
    )
    const wrapped = withApiErrorHandler(handler)
    const res = await wrapped()
    const body = await res.json()
    expect(body.error.message).toBe('请求太频繁，请稍后再试')
  })

  it('Accept-Language 为 en 时返回英文错误消息', async () => {
    // 验证：传入 Accept-Language: en 时返回英文
    const handler = vi.fn().mockRejectedValue(
      new BizException('RATE_LIMITED', '请求太频繁，请稍后再试', 429),
    )
    const wrapped = withApiErrorHandler(handler)
    const req = new Request('http://localhost/test', {
      headers: { 'Accept-Language': 'en' },
    })
    const res = await wrapped(req)
    const body = await res.json()
    expect(body.error.message).toBe('Too many requests. Please try again later.')
  })

  it('不支持的 locale 回退到中文', async () => {
    // 验证：Accept-Language 为 fr（不支持）时使用中文
    const handler = vi.fn().mockRejectedValue(
      new BizException('RATE_LIMITED', '请求太频繁，请稍后再试', 429),
    )
    const wrapped = withApiErrorHandler(handler)
    const req = new Request('http://localhost/test', {
      headers: { 'Accept-Language': 'fr' },
    })
    const res = await wrapped(req)
    const body = await res.json()
    expect(body.error.message).toBe('请求太频繁，请稍后再试')
  })

  it('字典中不存在的错误码回退到原始消息', async () => {
    // 验证：CUSTOM_ERROR 不在字典中，使用 BizException 的原始消息
    const handler = vi.fn().mockRejectedValue(
      new BizException('CUSTOM_ERROR', '自定义错误', 400),
    )
    const wrapped = withApiErrorHandler(handler)
    const req = new Request('http://localhost/test', {
      headers: { 'Accept-Language': 'en' },
    })
    const res = await wrapped(req)
    const body = await res.json()
    expect(body.error.message).toBe('自定义错误')
  })

  it('INTERNAL_ERROR 也支持多语言', async () => {
    // 验证：未知异常的 500 错误根据 Accept-Language 返回对应语言
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = vi.fn().mockRejectedValue(new Error('db crash'))
    const wrapped = withApiErrorHandler(handler)
    const req = new Request('http://localhost/test', {
      headers: { 'Accept-Language': 'en' },
    })
    const res = await wrapped(req)
    const body = await res.json()
    expect(body.error.message).toBe('Service temporarily unavailable. Please try again later.')
  })
})
