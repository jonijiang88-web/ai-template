import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('app/api/health 路由', () => {
  it('GET 返回 { status: "ok" } 且状态码为 200', async () => {
    const res = await GET()

    // 验证：状态码为 200
    expect(res.status).toBe(200)
    // 验证：返回的 JSON 为 { status: 'ok' }
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })
})
