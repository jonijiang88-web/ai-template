<!-- BEGIN:nextjs-agent-rules -->
# 这不是你熟悉的 Next.js

当前版本存在破坏性变更——API、约定和文件结构可能与你训练数据中的有所不同。在编写代码之前，请先阅读 `node_modules/next/dist/docs/` 中的相关指南。注意废弃通知。
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-style-linear -->
# UI 风格参考：Linear

涉及 UI 的前端工作必须先阅读并严格遵循 `doc/ui-style-guide.md` 中的 Linear 视觉与交互规范。
<!-- END:ui-style-linear -->

<!-- BEGIN:lessons-learned -->
# 经验教训

## 外部服务客户端必须延迟初始化

模块加载时不应实例化外部 SDK（Resend、Supabase Admin Client 等），否则 Next.js 构建时若缺少 API Key 会直接报错。

```ts
// ❌ 错误：模块加载时就实例化
const resend = new Resend(process.env.RESEND_API_KEY)

// ✅ 正确：用到时才初始化
let resend: Resend | null = null
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}
```

这条规则的例外：`NEXT_PUBLIC_` 前缀的客户端 SDK（如 Supabase 浏览器客户端），因为它们的 key 设计为公开。
<!-- END:lessons-learned -->

<!-- BEGIN:ai-sdk -->
# Vercel AI SDK

项目已集成 `ai@7.x` + `@ai-sdk/deepseek`，通过 `streamText` 流式调用 DeepSeek 模型。具体功能参考 `doc/ai-sdk.md`。

关键约定：
- `useChat` 的 **`initialMessages` prop 不可用**（v7 类型不支持），改用 `setMessages()` 加载历史
- `UIMessage` 用 `parts` 数组替代旧的 `content` 字符串
- `streamText` 需显式指定 Provider（如 `deepSeek('deepseek-v4-flash')`），否则默认走 AI Gateway
- 消息持久化在 `streamText` 的 `onFinish` 回调中调用 `saveMessages()`
- DevTools Telemetry 仅开发环境注册（`process.env.NODE_ENV === 'development'`）
<!-- END:ai-sdk -->

<!-- BEGIN:api-patterns -->
# API 路由模式

新的 API Route Handler 应遵循的模式：

## 鉴权 + 限流
```ts
import { createClient } from '@/app/_lib/supabase/server'
import { BizException } from '@/app/_lib/BizException'
import { withApiErrorHandler } from '@/app/_lib/api-error-handler'
import { checkRateLimit } from '@/app/_lib/rate-limit'

async function handler() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new BizException('UNAUTHORIZED', '未登录', 401)

  if (!checkRateLimit(`api:${user.id}`, 30, 60_000)) {
    throw new BizException('RATE_LIMITED', '请求太频繁', 429)
  }

  // ... 业务逻辑
}

export const GET = withApiErrorHandler(handler)
```

## 结构化错误
```ts
throw new BizException('ERROR_CODE', '用户可见的错误信息', 422)
// 自动转为 { error: { code: 'ERROR_CODE', message: '...' } }
```
未知异常自动转为 500，不泄漏内部错误细节。

## 错误消息多语言
API 错误消息根据 `Accept-Language` 头自动切换中/英。
新增错误码时需同时在 `app/_lib/api-error-handler.ts` 的 `errorMessages` 字典中添加翻译。
详细规范见 `doc/i18n.md`。
<!-- END:api-patterns -->

<!-- BEGIN:project-structure -->
# 项目结构约定

```
app/_lib/          # 工具库（无业务逻辑）
app/_service/      # 业务逻辑层（可测试）
app/api/           # Route Handler（薄层，仅鉴权+转发）
app/[locale]/      # 页面（Server Component 优先）
  _components/     # 客户端组件（'use client'）
doc/               # 项目文档
```

- DB 消息 ↔ UI 消息转换使用 `toUIMessage()`（`app/_service/chat.ts`）
- 测试文件紧邻源文件：`chat.ts` + `chat.test.ts`
<!-- END:project-structure -->
