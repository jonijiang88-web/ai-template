[![English](https://img.shields.io/badge/English-blue?style=flat)](./README.md)

# AI Chat Template

![Stack](https://img.shields.io/badge/Next.js_16-000?logo=next.js) ![Stack](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase) ![Stack](https://img.shields.io/badge/DeepSeek-4F6BF4?logo=deepseek) ![Stack](https://img.shields.io/badge/Vercel-000?logo=vercel)

**一个开箱即用的 AI 聊天应用模板。** 注册三个账号、填三个 Key、30 分钟上线，月费 ¥0。

## 三步上线

```bash
# 1. 克隆
git clone https://github.com/jonijiang88-web/ai-template.git
cd ai-template && npm install

# 2. 配置环境变量
cp .env.example .env.local
# 填入 Supabase URL/Key + DeepSeek API Key

# 3. 启动
npm run dev
```

## 技术栈

| 层 | 选型 | 成本 |
|---|------|------|
| **框架** | Next.js 16 (App Router) | 免费 |
| **托管** | Vercel (Hobby) | 免费 |
| **数据库 / 鉴权** | Supabase | 免费 (500MB) |
| **AI 模型** | DeepSeek V4 (via `@ai-sdk/deepseek`) | 按量 (新用户有赠送) |
| **邮件** | Resend | 免费 (3000封/月) |
| **样式** | Tailwind CSS 4 + Linear 风格 | — |
| **测试** | Vitest | — |

## 功能

- ✅ **AI 聊天** — Vercel AI SDK 流式响应，支持 Markdown 渲染（代码块、表格、列表）
- ✅ **邮箱登录** — Supabase Auth + Resend 确认邮件
- ✅ **多语言** — 中文 / English（next-intl）
- ✅ **全栈类型安全** — Zod 校验、TypeScript 严格模式
- ✅ **零成本托管** — Vercel Hobby + Supabase Free + Resend Free

## 脚本

```bash
npm run dev              # 开发
npm run build            # 构建
npm run start            # 生产启动
npm run test             # 单元测试
npm run test:integration # Supabase 连通性测试
npm run lint             # 代码检查
```

## 项目结构

```
app/
├── _components/     # 共享 UI 组件
├── _lib/            # 工具库（Error handling、Supabase 客户端）
├── _service/        # 业务逻辑层
├── api/             # Route Handler
│   └── chat/        # 流式聊天 API（DeepSeek）
├── auth/            # 认证回调
├── [locale]/
│   ├── chat/        # 聊天页面（useChat hook + Markdown 渲染）
│   └── login/       # 登录/注册
├── globals.css
└── layout.tsx
```

## 你需要准备

1. **Supabase 项目** → [supabase.com](https://supabase.com) → Settings → API → 复制 URL 和 anon key
2. **DeepSeek API Key** → [platform.deepseek.com](https://platform.deepseek.com/api_keys) → 创建 key
3. **Resend API Key**（可选，不配也能跑）→ [resend.com](https://resend.com) → API Keys

填到 `.env.local` 即可。

## 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jonijiang88-web/ai-template)

一键导入仓库，环境变量照搬 `.env.local`，点一下即可上线。

## License

MIT
