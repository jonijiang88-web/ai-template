'use client'

import { useReducer, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type State = {
  messages: Message[]
  input: string
  loading: boolean
}

type Action =
  | { type: 'LOAD_HISTORY'; messages: Message[] }
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SEND_START'; content: string }
  | { type: 'SEND_SUCCESS'; reply: string }
  | { type: 'SEND_ERROR'; message: string }

function chatReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_HISTORY':
      return { ...state, messages: action.messages }

    case 'SET_INPUT':
      return { ...state, input: action.value }

    case 'SEND_START':
      return {
        messages: [...state.messages, { role: 'user', content: action.content }],
        input: '',
        loading: true,
      }

    case 'SEND_SUCCESS':
      return {
        ...state,
        messages: [...state.messages, { role: 'assistant', content: action.reply }],
        loading: false,
      }

    case 'SEND_ERROR':
      return {
        ...state,
        messages: [...state.messages, { role: 'assistant', content: action.message }],
        loading: false,
      }
  }
}

/**
 * ChatBox 客户端组件 —— 聊天消息列表与发送表单。
 *
 * 从 /api/chat 读取历史消息，通过 POST /api/chat 发送新消息。
 * 前端 role 使用 'assistant'（替代旧版 'bot'），与 Supabase messages 表一致。
 */
export default function ChatBox() {
  const t = useTranslations('Chat')
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    input: '',
    loading: false,
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          // 将数据层 role 映射为前端 Message 类型
          const mapped = data.messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
          dispatch({ type: 'LOAD_HISTORY', messages: mapped })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!state.input.trim() || state.loading) return

    dispatch({ type: 'SEND_START', content: state.input })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: state.input }),
      })
      const data = await res.json()
      if (data.reply) {
        dispatch({ type: 'SEND_SUCCESS', reply: data.reply })
      } else {
        dispatch({ type: 'SEND_ERROR', message: t('sendFailed') })
      }
    } catch {
      dispatch({ type: 'SEND_ERROR', message: t('sendFailed') })
    }
  }

  return (
    <div className="flex h-full w-full max-w-3xl flex-col border border-border bg-background shadow-sm sm:rounded-[10px]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {state.messages.length === 0 && (
          <p className="mt-20 text-center text-sm text-placeholder">{t('empty')}</p>
        )}
        {state.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-[8px] px-4 py-2.5 text-sm leading-6 sm:max-w-[70%] ${
              msg.role === 'user'
                ? 'bg-accent text-white'
                : 'bg-panel text-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {state.loading && (
          <div className="flex justify-start">
            <div className="rounded-[8px] bg-panel px-4 py-2.5 text-sm text-placeholder">
              {t('typing')}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-4 sm:p-5">
        <input
          value={state.input}
          onChange={e => dispatch({ type: 'SET_INPUT', value: e.target.value })}
          placeholder={t('inputPlaceholder')}
          className="min-w-0 flex-1 rounded-[6px] border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors duration-150 ease-in-out placeholder:text-placeholder focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          disabled={state.loading}
        />
        <button
          type="submit"
          disabled={state.loading || !state.input.trim()}
          className="rounded-[6px] bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-150 ease-in-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
        >
          {t('send')}
        </button>
      </form>
      <div ref={bottomRef} />
    </div>
  )
}
