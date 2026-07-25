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
