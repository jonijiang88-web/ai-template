/**
 * 聊天消息类型，对应数据库 messages 表 + AI SDK UIMessage 兼容字段。
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string | null
}

/** 聊天历史接口返回的 AI SDK UIMessage 文本消息。 */
export interface ChatHistoryMessage {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{ type: string; text?: string }>
}

/**
 * 聊天 API POST 请求体。
 */
export interface ChatRequest {
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    parts: Array<{ type: 'text'; text: string }>
  }>
}

/**
 * 聊天 API GET 响应体。
 */
export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[]
}

/**
 * SSE 事件数据类型。
 */
export interface StreamEvent {
  type: 'text_chunk' | 'finish' | 'error'
  text?: string
  finishReason?: string
  error?: string
}
