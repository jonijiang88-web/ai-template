import { describe, it, expect } from 'vitest'
import { BizException } from './BizException'

describe('BizException', () => {
  it('创建实例时正确设置 code、message、status 属性', () => {
    // 验证：构建 BizException 后各属性值与入参一致
    const ex = new BizException('AUTH_FAILED', '认证失败', 401)
    expect(ex.code).toBe('AUTH_FAILED')
    expect(ex.message).toBe('认证失败')
    expect(ex.status).toBe(401)
  })

  it('继承 Error，name 为 BizException', () => {
    // 验证：BizException 是 Error 的子类，name 为自定义值
    const ex = new BizException('FORBIDDEN', '无权限', 403)
    expect(ex).toBeInstanceOf(Error)
    expect(ex.name).toBe('BizException')
  })

  it('支持 4xx 范围内所有合法状态码', () => {
    // 验证：400、401、403、404、429 等常见 4xx 均能正常构造
    const codes = [400, 401, 403, 404, 405, 409, 422, 429, 499]
    for (const c of codes) {
      const ex = new BizException(`ERR_${c}`, `错误${c}`, c)
      expect(ex.status).toBe(c)
    }
  })

  it('传入非 4xx status 时抛出 RangeError', () => {
    // 验证：200（成功状态码）应被拒绝
    expect(() => new BizException('OK', '正常', 200)).toThrow(RangeError)
  })

  it('传入非 4xx status 时抛出 RangeError（500 服务端错误）', () => {
    // 验证：500（服务端错误码）应被拒绝
    expect(() => new BizException('ERR', '错误', 500)).toThrow(RangeError)
  })

  it('传入非 4xx status 时抛出 RangeError（100 信息类）', () => {
    // 验证：100（信息类状态码）应被拒绝
    expect(() => new BizException('INFO', '信息', 100)).toThrow(RangeError)
  })

  it('传入非 4xx status 时抛出 RangeError（300 重定向类）', () => {
    // 验证：302（重定向状态码）应被拒绝
    expect(() => new BizException('REDIRECT', '重定向', 302)).toThrow(RangeError)
  })

  it('toString 包含 code 和 message', () => {
    // 验证：toString() 返回的字符串应包含异常编码和消息
    const ex = new BizException('BAD_REQUEST', '请求参数错误', 400)
    const str = ex.toString()
    expect(str).toContain('BizException')
    expect(str).toContain('BAD_REQUEST')
    expect(str).toContain('请求参数错误')
  })
})
