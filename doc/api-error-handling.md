# API 错误处理约定

## 统一错误处理入口

所有本项目自写的 Route Handler **必须**经 `withApiErrorHandler` 导出，以确保：

- `BizException` 被捕获后返回结构化 JSON `{ error: { code, message } }` 及对应的 4xx 状态码
- 未知异常被捕获后返回 `{ error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' } }` 及 500 状态码，**不泄漏**原始错误细节
- 错误消息根据 `Accept-Language` 头自动切换中/英文，翻译文本来自 `app/_lib/i18n/messages/*.json`

## 使用方式

```typescript
import { withApiErrorHandler } from '@/app/_lib/api-error-handler'

async function myHandler() {
  // 业务逻辑...
  throw new BizException('NOT_FOUND', '资源不存在', 404)
}

export const GET = withApiErrorHandler(myHandler)
```

## 例外规则

第三方库提供的完整 Route Handler（如 NextAuth 的 `handlers`）以及浏览器重定向协议端点（如 Supabase Auth 回调）**不得**套用 `withApiErrorHandler`，原因：

1. 第三方库内部已有自己的错误处理逻辑，不应拦截
2. 包装后可能破坏其协议兼容性或预期行为；重定向端点必须返回跳转响应而非 JSON

例外必须在路由文件中以**中文注释**说明原因。

## 约束

- 不要修改第三方库提供的 handler
- 不要在一个路由文件中混用包装和未包装的导出
