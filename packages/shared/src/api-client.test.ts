import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './api-client'

/** 构造包含推理帧与正文帧的 AI SDK UI Message Stream。 */
function createSampleStream(): string {
  return [
    'data: {"type":"start"}\n\n',
    'data: {"type":"reasoning-delta","id":"reasoning-0","delta":"内部推理"}\n\n',
    'data: {"type":"text-start","id":"txt-0"}\n\n',
    'data: {"type":"text-delta","id":"txt-0","delta":"你好"}\n\n',
    'data: {"type":"text-delta","id":"txt-0","delta":"！"}\n\n',
    'data: {"type":"text-end","id":"txt-0"}\n\n',
    'data: {"type":"finish"}\n\n',
  ].join('')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ApiClient', () => {
  it('仅将 text-delta 渲染为聊天正文', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(createSampleStream(), {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const chunks: string[] = []

    const reply = await new ApiClient('https://api.example.com', 'access-token').sendMessage(
      [{ id: 'user-1', role: 'user', content: '你好', createdAt: null }],
      chunk => chunks.push(chunk),
    )

    // 验证：聊天正文仅包含 text-delta 的内容
    expect(reply).toBe('你好！')
    // 验证：推理帧不会泄漏到聊天正文
    expect(chunks).toEqual(['你好', '！'])
    // 验证：移动端请求携带 Bearer Token
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer access-token',
    })
  })

  it('将服务端 UIMessage 历史转换为移动端消息 DTO', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        messages: [{
          id: 'history-1',
          role: 'assistant',
          parts: [{ type: 'text', text: '历史回复' }],
        }],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const messages = await new ApiClient('https://api.example.com').getMessages()

    // 验证：历史消息可作为移动端正文渲染
    expect(messages).toEqual([
      { id: 'history-1', role: 'assistant', content: '历史回复', createdAt: null },
    ])
  })
})
