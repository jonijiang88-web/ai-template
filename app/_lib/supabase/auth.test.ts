import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}))

vi.mock('./server', () => ({
  createClient: mockCreateClient,
}))

import { getAuthenticatedUser } from './auth'

/** 创建通过 Supabase 鉴权的模拟用户。 */
function createUser() {
  return { id: 'user-uuid', email: 'test@example.com' }
}

describe('getAuthenticatedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('使用 Bearer Token 创建携带用户身份的数据客户端', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: createUser() }, error: null }),
      },
    }
    mockCreateClient.mockResolvedValue(supabase)
    const request = new Request('http://localhost/api/chat', {
      headers: { Authorization: 'Bearer mobile-access-token' },
    })

    const result = await getAuthenticatedUser(request)

    // 验证：服务端客户端使用移动端 Bearer Token 初始化
    expect(mockCreateClient).toHaveBeenCalledWith('mobile-access-token')
    // 验证：鉴权校验使用传入的 Bearer Token
    expect(supabase.auth.getUser).toHaveBeenCalledWith('mobile-access-token')
    // 验证：后续查询复用携带用户身份的客户端
    expect(result.supabase).toBe(supabase)
  })

  it('无效 Bearer Token 直接拒绝，不回退到 Cookie 会话', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('invalid token') }),
      },
    }
    mockCreateClient.mockResolvedValue(supabase)
    const request = new Request('http://localhost/api/chat', {
      headers: { Authorization: 'Bearer invalid-token' },
    })

    // 验证：无效 Bearer Token 返回未登录错误
    await expect(getAuthenticatedUser(request)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    })
    // 验证：不会创建第二个 Cookie 会话客户端进行降级鉴权
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })

  it('未提供 Bearer Token 时使用 Web Cookie 会话', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: createUser() }, error: null }),
      },
    }
    mockCreateClient.mockResolvedValue(supabase)

    const result = await getAuthenticatedUser(new Request('http://localhost/api/chat'))

    // 验证：Cookie 会话不传入 Bearer Token 初始化客户端
    expect(mockCreateClient).toHaveBeenCalledWith(undefined)
    // 验证：Cookie 会话通过无参 getUser 校验
    expect(supabase.auth.getUser).toHaveBeenCalledWith()
    // 验证：返回 Cookie 会话对应的用户
    expect(result.user.id).toBe('user-uuid')
  })
})
