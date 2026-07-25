[![中文](https://img.shields.io/badge/中文-red?style=flat)](./README.md)

# AI Chat Template

![Stack](https://img.shields.io/badge/Next.js_16-000?logo=next.js) ![Stack](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase) ![Stack](https://img.shields.io/badge/DeepSeek-4F6BF4?logo=deepseek) ![Stack](https://img.shields.io/badge/Vercel-000?logo=vercel)

**A production-ready AI chatbot template.** Sign up for 3 services, fill in 3 keys, go live in 30 minutes. Monthly cost: \$0.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/jonijiang88-web/ai-template.git
cd ai-template && npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase URL/Key + DeepSeek API Key

# 3. Start
npm run dev
```

## Tech Stack

| Layer | Choice | Cost |
|-------|--------|------|
| **Framework** | Next.js 16 (App Router) | Free |
| **Hosting** | Vercel (Hobby) | Free |
| **Database / Auth** | Supabase | Free (500MB) |
| **AI Model** | DeepSeek V4 (via `@ai-sdk/deepseek`) | Pay-as-you-go |
| **Email** | Resend | Free (3K emails/mo) |
| **Styling** | Tailwind CSS 4 + Linear Design | — |
| **Testing** | Vitest | — |

## Features

- ✅ **AI Chat** — Streaming via Vercel AI SDK, Markdown rendering (code blocks, tables, lists)
- ✅ **Email Auth** — Supabase Auth + Resend confirmation emails
- ✅ **i18n** — Chinese / English (next-intl)
- ✅ **Full-stack Type Safety** — Zod validation, strict TypeScript
- ✅ **Zero-cost Hosting** — Vercel Hobby + Supabase Free + Resend Free

## Scripts

```bash
npm run dev              # Development
npm run build            # Build
npm run start            # Start production
npm run test             # Unit tests
npm run test:integration # Supabase connectivity
npm run lint             # Lint
```

## Project Structure

```
app/
├── _components/     # Shared UI components
├── _lib/            # Utilities (Error handling, Supabase client)
├── _service/        # Business logic layer
├── api/             # Route Handlers
│   └── chat/        # Streaming chat API (DeepSeek)
├── auth/            # Auth callbacks
├── [locale]/
│   ├── chat/        # Chat page (useChat hook + Markdown rendering)
│   └── login/       # Login / Register
├── globals.css
└── layout.tsx
```

## Prerequisites

1. **Supabase Project** → [supabase.com](https://supabase.com) → Settings → API → Copy URL & anon key
2. **DeepSeek API Key** → [platform.deepseek.com](https://platform.deepseek.com/api_keys) → Create key
3. **Resend API Key** (optional) → [resend.com](https://resend.com) → API Keys

Paste them into `.env.local`.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jonijiang88-web/ai-template)

One-click import. Copy the same environment variables from `.env.local`.

## License

MIT
