'use client'

import { useReducer, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'bot'
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
        messages: [...state.messages, { role: 'bot', content: action.reply }],
        loading: false,
      }

    case 'SEND_ERROR':
      return {
        ...state,
        messages: [...state.messages, { role: 'bot', content: '出错了，请重试' }],
        loading: false,
      }
  }
}

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
      .then(data => dispatch({ type: 'LOAD_HISTORY', messages: data.messages }))
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
      dispatch({ type: 'SEND_SUCCESS', reply: data.reply })
    } catch {
      dispatch({ type: 'SEND_ERROR' })
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto border rounded-xl shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {state.messages.length === 0 && (
          <p className="text-center text-zinc-400 mt-20">开始聊天吧！</p>
        )}
        {state.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {state.loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 rounded-xl px-4 py-2 text-zinc-400">
              正在输入...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          value={state.input}
          onChange={e => dispatch({ type: 'SET_INPUT', value: e.target.value })}
          placeholder="输入消息..."
          className="flex-1 rounded-lg border px-4 py-2 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={state.loading || !state.input.trim()}
          className="bg-blue-600 text-white rounded-lg px-6 py-2 disabled:opacity-50 hover:bg-blue-700"
        >
          发送
        </button>
      </form>
    </div>
  )
}
