import { describe, it, expect, vi, beforeEach } from 'vitest'

// 使用 vi.hoisted 确保 mock 变量在 vi.mock 提升前已定义
const { mockGetChatRepo, mockFind, mockCreate, mockSave } = vi.hoisted(() => {
  return {
    mockGetChatRepo: vi.fn(),
    mockFind: vi.fn(),
    mockCreate: vi.fn(),
    mockSave: vi.fn(),
  }
})

// 模拟 repository 层
vi.mock('../_repository/chat', () => ({
  getChatRepo: mockGetChatRepo,
}))

import { getMessages, sendMessage } from './chat'

describe('chat 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // mockGetChatRepo 返回一个模拟的 TypeORM Repository
    mockGetChatRepo.mockResolvedValue({
      find: mockFind,
      create: mockCreate,
      save: mockSave,
    })
  })

  describe('getMessages', () => {
    it('按指定 userId 查询消息，按 id 升序排列', async () => {
      // 模拟返回空数组
      mockFind.mockResolvedValue([])

      await getMessages('user@test.com')

      // 验证：find 查询条件包含 where.userId 和 order
      expect(mockFind).toHaveBeenCalledWith({
        where: { userId: 'user@test.com' },
        order: { id: 'ASC' },
      })
    })

    it('返回查询到的消息列表', async () => {
      // 模拟返回两条消息
      const fakeMessages = [
        { id: 1, userId: 'user@test.com', role: 'user', content: 'hi' },
        { id: 2, userId: 'user@test.com', role: 'bot', content: '你说了: "hi"' },
      ]
      mockFind.mockResolvedValue(fakeMessages)

      const result = await getMessages('user@test.com')

      // 验证：返回的内容与 mock 数据一致
      expect(result).toEqual(fakeMessages)
    })

    it('不同 userId 查询互不干扰', async () => {
      // 模拟根据 userId 过滤——此处 mock 简化，只验证查询条件
      mockFind.mockResolvedValue([])

      await getMessages('alice@test.com')
      await getMessages('bob@test.com')

      // 验证：两次调用的 userId 不同
      expect(mockFind).toHaveBeenNthCalledWith(1, {
        where: { userId: 'alice@test.com' },
        order: { id: 'ASC' },
      })
      expect(mockFind).toHaveBeenNthCalledWith(2, {
        where: { userId: 'bob@test.com' },
        order: { id: 'ASC' },
      })
    })
  })

  describe('sendMessage', () => {
    beforeEach(() => {
      // repo.create 返回传入的数据对象（模拟 TypeORM 行为）
      mockCreate.mockImplementation((data: unknown) => ({ ...data as object }))
      // repo.save 返回保存的对象
      mockSave.mockImplementation((data: unknown) => Promise.resolve(data))
    })

    it('创建用户消息时 role 为 user 并绑定 userId', async () => {
      await sendMessage('user@test.com', 'hello')

      // 验证：创建用户消息时 role='user', content='hello', userId 正确
      expect(mockCreate).toHaveBeenCalledWith({
        role: 'user',
        content: 'hello',
        userId: 'user@test.com',
      })
    })

    it('创建机器人回复时 role 为 bot 并绑定同一 userId', async () => {
      await sendMessage('user@test.com', 'hello')

      // 验证：创建 bot 消息时 role='bot', 且 userId 与用户消息一致
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'bot',
          userId: 'user@test.com',
        }),
      )
    })

    it('共创建两条消息（user + bot）', async () => {
      await sendMessage('user@test.com', 'hello')

      // 验证：create 被调用了两次
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it('保存了用户消息和机器人消息', async () => {
      await sendMessage('user@test.com', 'hello')

      // 验证：save 被调用了两次（userMsg 和 botMsg）
      expect(mockSave).toHaveBeenCalledTimes(2)
    })

    it('返回生成的回复内容', async () => {
      const reply = await sendMessage('user@test.com', '你好')

      // 验证：回复内容包含 "你说了: " 前缀和原始内容
      expect(reply).toBe('你说了: "你好"')
    })

    it('不同 userId 发送消息时分别绑定各自 userId', async () => {
      await sendMessage('alice@test.com', 'hi')
      await sendMessage('bob@test.com', 'hey')

      // 验证：第一次调用 userId 为 alice
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'alice@test.com' }),
      )
      // 验证：第二次调用 userId 为 bob
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'bob@test.com' }),
      )
    })
  })
})
