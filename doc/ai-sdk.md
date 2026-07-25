<!-- BEGIN:ai-sdk -->
# Vercel AI SDK 功能参考

AI SDK v7 是 Vercel 出品的 TypeScript 库，用于构建 AI 应用。当前版本 `ai@7.x`，DeepSeek 提供者 `@ai-sdk/deepseek@3.x`。

## 架构分层

```
┌──────────────────────────────────┐
│         AI SDK UI                │  ← React hooks（useChat 等）
├──────────────────────────────────┤
│         AI SDK Core              │  ← 核心 API（streamText 等）
├──────────────────────────────────┤
│         Provider Layer           │  ← 模型适配层（OpenAI / DeepSeek / ...）
└──────────────────────────────────┘
```

---

## 1. AI SDK Core — 核心 API

### `generateText` — 一次性生成
```ts
import { generateText } from 'ai'
import { deepSeek } from '@ai-sdk/deepseek'

const { text } = await generateText({
  model: deepSeek('deepseek-v4-flash'),
  prompt: '写一首诗',
})
```

### `streamText` — 流式生成（推荐用于聊天）
```ts
import { streamText } from 'ai'

const result = streamText({
  model: deepSeek('deepseek-v4-flash'),
  messages: await convertToModelMessages(uiMessages),
  onFinish: async ({ text }) => { /* 持久化 */ },
})
```

### `generateObject` / `streamObject` — 生成结构化数据
```ts
const { object } = await generateObject({
  model: deepSeek('deepseek-v4-flash'),
  schema: z.object({ name: z.string(), age: z.number() }),
  prompt: '提取信息',
})
```
适合：信息提取、分类、JSON 输出。

### `embed` / `embedMany` — 文本嵌入
```ts
const { embedding } = await embed({
  model: provider.embeddingModel('text-embedding-model'),
  value: '要嵌入的文本',
})
```
适合：RAG、语义搜索。

### `generateImage` — 图片生成
```ts
const { images } = await generateImage({
  model: provider.imageModel('model-id'),
  prompt: '夕阳下的城市',
})
```

### `generateSpeech` / `transcribe` — 语音 / 转录
适合：TTS、语音转文字。

---

## 2. AI SDK UI — React Hooks

### `useChat` — 聊天对话（已在项目中集成）
```tsx
import { useChat } from '@ai-sdk/react'

function ChatBox() {
  const { messages, sendMessage, status, error } = useChat()
  // messages → UIMessage[], 含 parts 数组
  // sendMessage({ text: '...' }) → 发送并流式接收
  // status → 'ready' | 'streaming' | 'error'
}
```

API 路由接收格式：
```ts
// POST /api/chat
const { messages }: { messages: UIMessage[] } = await req.json()
const result = streamText({ model, messages: await convertToModelMessages(messages) })
return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })
```

### `useCompletion` — 文本补全（非对话）
适合：自动补全、生成单个回复。

### `useObject` — 流式结构化输出
适合：实时解析 JSON 流。

### `useChat` 持久化模式
- 客户端 `onFinish` 回调保存到数据库
- 初始历史通过 `setMessages()` 加载
- 不支持 `initialMessages` prop（v7 无此属性）

---

## 3. Provider 支持

### 一等公民（官方维护）
`@ai-sdk/openai` / `@ai-sdk/anthropic` / `@ai-sdk/deepseek` / `@ai-sdk/google` / `@ai-sdk/mistral` 等

### OpenAI 兼容（自定义）
```ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const provider = createOpenAICompatible({
  name: 'my-provider',
  apiKey: process.env.PROVIDER_API_KEY,
  baseURL: 'https://api.example.com/v1',
})
```

### Vercel AI Gateway
统一网关，一个 Key 调多个模型。

---

## 4. Tool Calling（函数调用）

```ts
const result = streamText({
  model: deepSeek('deepseek-v4-flash'),
  tools: {
    weather: tool({
      description: '获取天气',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => getWeather(location),
    }),
  },
})
```

支持多步工具调用：`stopWhen: isStepCount(5)`。

---

## 5. Agents（代理模式）

- **Building Agents**：循环调用 LLM + 工具
- **Memory**：持久化对话记忆
- **Subagents**：子代理分工
- **WorkflowAgent**：工作流式代理

---

## 6. DevTools — 开发时可观测性

```bash
npm run ai-devtools
# 打开 http://localhost:4983
```

捕获每次 AI SDK 调用的：
- 完整输入参数和 prompt
- 输出内容和 token 用量
- 耗时和分步追踪
- 多步 agent 交互的步骤链路

注册方式（仅在开发环境生效）：

```ts
import { registerTelemetry } from 'ai'
import { DevToolsTelemetry } from '@ai-sdk/devtools'

if (process.env.NODE_ENV === 'development') {
  registerTelemetry(DevToolsTelemetry())
}
```

---

## 7. 本项目集成状态

| 能力 | 状态 |
|------|------|
| `streamText` + DeepSeek | ✅ 已集成 |
| `useChat` 流式 UI | ✅ 已集成 |
| 消息持久化 (Supabase) | ✅ 已集成 |
| DevTools 可观测性 | ✅ 已集成 |
| 内存限流 (rate-limit) | ✅ 已集成 |
| `generateText` | ❌ 未用 |
| `generateObject` | ❌ 未用 |
| Tool Calling | ❌ 未用 |
| Agents | ❌ 未用 |
| Embeddings | ❌ 未用 |

---

## 7. 注意事项

- `useChat` 的 `initialMessages` **不可用**（v7 类型不支持），改用 `setMessages()`
- `UIMessage` 在 v7 中使用 `parts` 数组替代旧的 `content` 字符串
- `streamText` 默认使用 AI Gateway，需显式指定提供者（如 `deepSeek(...)`）
- `convertToModelMessages()` 用于将 `UIMessage[]` 转为模型可用的 `ModelMessage[]`
- BigInt 精度问题：不需要在前端传递大整数，使用字符串即可
<!-- END:ai-sdk -->
