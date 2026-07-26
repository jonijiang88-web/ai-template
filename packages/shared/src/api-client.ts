import type { ChatHistoryMessage, ChatMessage, ChatHistoryResponse } from './types'

/** 将服务端 UIMessage 历史记录转换为移动端渲染所需的消息 DTO。 */
function toChatMessage(message: ChatHistoryMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text ?? '')
      .join(''),
    createdAt: null,
  }
}

/**
 * API 客户端 —— 封装与后端聊天接口的通信。
 *
 * Web 端使用相对路径（baseUrl = ''），移动端需要传入完整 baseUrl
 * （如 http://localhost:3000），通过 EXPO_PUBLIC_API_BASE_URL 环境变量配置。
 *
 * token 为 Supabase access_token，通过 Authorization: Bearer 头传递。
 */
export class ApiClient {
  constructor(
    private baseUrl: string,
    private token: string | null = null,
  ) {}

  /** API 基础路径 */
  private apiPrefix = '/api'

  /**
   * 设置或更新认证 token。
   */
  setToken(token: string | null) {
    this.token = token
  }

  /** 构造带认证头的请求头 */
  private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  /**
   * 获取聊天历史消息。
   */
  async getMessages(): Promise<ChatMessage[]> {
    const res = await fetch(`${this.baseUrl}${this.apiPrefix}/chat`, {
      headers: this.getHeaders(),
    })
    if (!res.ok) {
      throw new Error(`getMessages failed: ${res.status}`)
    }
    const data = (await res.json()) as ChatHistoryResponse
    return (data.messages ?? []).map(toChatMessage)
  }

  /**
   * 发送消息并获取 AI 回复（流式响应）。
   *
   * 在 React Native 中，response.text() 会等待流结束再返回完整 SSE 文本。
   * 如需实现逐字显示，需配合 `react-native-sse` 等库。
   *
   * @param messages  - 当前会话消息列表（UIMessage 格式）
   * @param onChunk   - 可选回调，每收到一段文本时触发（仅 Web/支持 ReadableStream 的环境）
   * @returns AI 回复的完整文本
   */
  async sendMessage(
    messages: ChatMessage[],
    onChunk?: (text: string) => void,
  ): Promise<string> {
    const body = {
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        parts: [{ type: 'text' as const, text: m.content }],
      })),
    }

    const res = await fetch(`${this.baseUrl}${this.apiPrefix}/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`sendMessage failed: ${res.status}`)
    }

    // 尝试流式读取（浏览器环境支持 ReadableStream）
    if (typeof ReadableStream !== 'undefined' && res.body) {
      return this.readStream(res.body, onChunk)
    }

    // 降级：等待完整响应
    const text = await res.text()
    const finalText = this.parseFinalTextFromSSE(text)
    onChunk?.(finalText)
    return finalText
  }

  /** 从 ReadableStream 读取 SSE 事件 */
  private async readStream(
    body: ReadableStream<Uint8Array>,
    onChunk?: (text: string) => void,
  ): Promise<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          const textChunk = this.parseTextChunk(event)
          if (textChunk) {
            fullText += textChunk
            onChunk?.(textChunk)
          }
        }
      }
      buffer += decoder.decode()
      // 处理剩余 buffer
      if (buffer.trim()) {
        const textChunk = this.parseTextChunk(buffer)
        if (textChunk) {
          fullText += textChunk
          onChunk?.(textChunk)
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullText
  }

  /**
   * 从 SSE 事件行中提取文本增量。
   *
   * AI SDK v7 的 UIMessageStream 格式：
   *   data: {"type":"text-delta","id":"...","delta":"Hello"}\n\n
   *   data: [DONE]\n\n
   */
  private parseTextChunk(eventText: string): string | null {
    for (const line of eventText.split('\n')) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6)
        // 跳过 [DONE] 结束标记
        if (raw === '[DONE]') continue
        try {
          const data = JSON.parse(raw)
          if (data.type === 'text-delta' && typeof data.delta === 'string') {
            return data.delta
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }
    return null
  }

  /** 从完整 SSE 文本中提取所有文本增量 */
  private parseFinalTextFromSSE(fullText: string): string {
    const lines = fullText.split(/\r?\n/)
    let result = ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6)
        if (raw === '[DONE]') continue
        try {
          const data = JSON.parse(raw)
          if (data.type === 'text-delta' && typeof data.delta === 'string') {
            result += data.delta
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    }
    return result
  }
}
