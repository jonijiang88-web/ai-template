'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { useTranslations } from 'next-intl'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'

/**
 * 将 DB 消息转为 AI SDK UIMessage。
 * 兼容服务端返回的 { id, role, parts } 格式或旧 { role, content } 格式。
 */
function normalizeMessage(m: Record<string, unknown>): UIMessage {
  if (m.parts && Array.isArray(m.parts)) {
    return m as unknown as UIMessage
  }
  return {
    id: (m.id as string) ?? crypto.randomUUID(),
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: (m.content as string) ?? '' }],
  }
}

/**
 * ChatBox 客户端组件 —— 基于 Vercel AI SDK useChat 的聊天界面。
 *
 * 支持流式响应、自动滚动、历史消息加载。
 */
export default function ChatBox() {
  const t = useTranslations('Chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const historyLoaded = useRef(false)

  const { messages, setMessages, sendMessage, status, error } = useChat()

  // 加载历史消息（仅首次挂载）
  useEffect(() => {
    if (historyLoaded.current) return
    historyLoaded.current = true

    fetch('/api/chat')
      .then(res => res.json())
      .then(data => {
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages.map(normalizeMessage))
        }
      })
      .catch(() => {})
  }, [setMessages])

  // 消息更新时自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** 提取消息中的纯文本 */
  function getMessageText(msg: UIMessage): string {
    return msg.parts
      .filter(p => p.type === 'text')
      .map(p => (p as { text: string }).text)
      .join('')
  }

  /** 处理表单提交 */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || status === 'streaming') return
    sendMessage({ text: input })
    setInput('')
  }

  const isStreaming = status === 'streaming'

  return (
    <div className="flex h-full w-full max-w-3xl flex-col border border-border bg-background shadow-sm sm:rounded-[10px]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 && (
          <p className="mt-20 text-center text-sm text-placeholder">{t('empty')}</p>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-[8px] px-4 py-2.5 text-sm leading-6 sm:max-w-[70%] ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-panel text-foreground'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert [&_pre]:overflow-x-auto [&_pre]:rounded-[6px] [&_pre]:bg-black/5 [&_pre]:p-3 [&_pre]:text-xs dark:[&_pre]:bg-white/10 [&_code]:rounded-[3px] [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 dark:[&_code]:bg-white/10">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {getMessageText(msg)}
                  </Markdown>
                </div>
              ) : (
                getMessageText(msg)
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex justify-start">
            <div className="rounded-[8px] bg-panel px-4 py-2.5 text-sm text-placeholder">
              <span className="inline-block animate-pulse">▊</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="rounded-[8px] bg-red-50 px-4 py-2 text-sm text-red-600">
              {t('sendFailed')}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-4 sm:p-5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className="min-w-0 flex-1 rounded-[6px] border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 ease-in-out placeholder:text-placeholder focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-[6px] bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-150 ease-in-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
        >
          {isStreaming ? '...' : t('send')}
        </button>
      </form>
      <div ref={bottomRef} />
    </div>
  )
}
