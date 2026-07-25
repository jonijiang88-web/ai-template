'use client'

import { useReducer, useRef, useEffect } from 'react'

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
  | { type: 'SEND_ERROR' }

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
        messages: [...state.messages, { role: 'assistant', content: '出错了，请重试' }],
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
        dispatch({ type: 'SEND_ERROR' })
      }
    } catch {
      dispatch({ type: 'SEND_ERROR' })
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto border border-[#e5e5e5] rounded-lg shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {state.messages.length === 0 && (
          <p className="text-center text-[#a0a0a0] mt-20 text-sm">Start chatting!</p>
        )}
        {state.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-[#5e6ad2] text-white'
                : 'bg-[#f8f8f8] text-[#1a1a1a]'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {state.loading && (
          <div className="flex justify-start">
            <div className="bg-[#f8f8f8] rounded-lg px-4 py-2 text-sm text-[#a0a0a0]">
              Typing...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#e5e5e5] p-4 flex gap-2">
        <input
          value={state.input}
          onChange={e => dispatch({ type: 'SET_INPUT', value: e.target.value })}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#a0a0a0] focus:border-[#5e6ad2] disabled:opacity-40"
          disabled={state.loading}
        />
        <button
          type="submit"
          disabled={state.loading || !state.input.trim()}
          className="rounded-md bg-[#5e6ad2] text-white px-5 py-2 text-sm font-medium transition hover:bg-[#4f5ad0] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
        >
          Send
        </button>
      </form>
      <div ref={bottomRef} />
    </div>
  )
}
