import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreateServerClient, mockGetUser, mockUploadAvatar, mockValidateImage, mockT, mockDetectLocale } = vi.hoisted(() => {
  return {
    mockCreateServerClient: vi.fn(),
    mockGetUser: vi.fn(),
    mockUploadAvatar: vi.fn(),
    mockValidateImage: vi.fn(),
    mockT: vi.fn((_locale: string, _ns: string, key: string, fallback: string) => fallback),
    mockDetectLocale: vi.fn(() => 'zh-CN' as const),
  }
})

vi.mock('@/app/_lib/supabase/server', () => ({
  createClient: mockCreateServerClient,
}))

vi.mock('@/app/_service/storage', () => ({
  uploadAvatar: mockUploadAvatar,
  validateImage: mockValidateImage,
}))

vi.mock('@/app/_lib/locale', () => ({
  detectLocaleFromRequest: mockDetectLocale,
}))

vi.mock('@/app/_lib/i18n/loader', () => ({
  t: mockT,
}))

import { POST } from './route'

function createMockSupabaseClient(user: { id: string } | null) {
  const result = user
    ? { data: { user }, error: null }
    : { data: { user: null }, error: new Error('Not authenticated') }

  mockGetUser.mockResolvedValue(result)
  return { auth: { getUser: mockGetUser } }
}

/** 创建包含上传文件的 FormData 请求。 */
function createUploadRequest(file?: File): Request {
  const formData = new FormData()
  if (file) formData.append('file', file)
  return new Request('http://localhost/api/upload/avatar', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/upload/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未登录时返回 401', async () => {
    mockCreateServerClient.mockResolvedValue(createMockSupabaseClient(null))
    const res = await POST(createUploadRequest(new File(['test'], 'a.jpg', { type: 'image/jpeg' })))

    // 验证：未登录返回 401
    expect(res.status).toBe(401)
    expect(mockUploadAvatar).not.toHaveBeenCalled()
  })

  it('缺少 file 字段时返回 400', async () => {
    mockCreateServerClient.mockResolvedValue(
      createMockSupabaseClient({ id: 'user-uuid' }),
    )

    const res = await POST(createUploadRequest()) // 无 file

    // 验证：缺少文件返回 400
    expect(res.status).toBe(400)
  })

  it('成功上传后返回 URL', async () => {
    mockCreateServerClient.mockResolvedValue(
      createMockSupabaseClient({ id: 'user-uuid' }),
    )
    mockValidateImage.mockReturnValue(null)
    mockUploadAvatar.mockResolvedValue('https://example.com/avatar.jpg')
    mockValidateImage.mockReturnValue(null)

    const file = new File(['fake'], 'avatar.jpg', { type: 'image/jpeg' })
    const res = await POST(createUploadRequest(file))

    // 验证：上传成功返回 200 及 URL
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('url')
    expect(body.url).toBe('https://example.com/avatar.jpg')
    // 验证：uploadAvatar 被传入正确的 userId 和 file
    const [calledUserId, calledFile] = mockUploadAvatar.mock.calls[0]
    expect(calledUserId).toBe('user-uuid')
    // 验证：file 的 name 和 type 一致
    expect(calledFile.name).toBe('avatar.jpg')
    expect(calledFile.type).toBe('image/jpeg')
  })

  it('文件类型不合法时返回 400', async () => {
    mockCreateServerClient.mockResolvedValue(
      createMockSupabaseClient({ id: 'user-uuid' }),
    )
    mockValidateImage.mockReturnValue('不支持的文件格式')

    const file = new File(['test'], 'file.txt', { type: 'text/plain' })
    const res = await POST(createUploadRequest(file))

    // 验证：文件类型不合法返回 400
    expect(res.status).toBe(400)
    // 验证：uploadAvatar 未被调用
    expect(mockUploadAvatar).not.toHaveBeenCalled()
  })
})
