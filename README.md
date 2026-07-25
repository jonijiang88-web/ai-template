这是一个基于 [Next.js](https://nextjs.org) + [Supabase](https://supabase.com) 的全栈项目模板。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **认证**: Supabase Auth (邮箱密码登录)
- **数据库**: Supabase Postgres (通过 Data API 访问)
- **样式**: Tailwind CSS 4 + Linear 风格 UI
- **数据校验**: Zod
- **测试**: Vitest

## 本地开发

### 前置条件

1. Node.js 24+
2. Docker Desktop（仅本地 Supabase 模拟需要）

### 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量并填写你的 Supabase 项目配置
cp .env.example .env.local
# 编辑 .env.local，填入你的 Supabase URL 和匿名密钥

# 3. 启动开发服务器
npm run dev
```

### 数据库迁移

本项目使用 [Supabase Migration](https://supabase.com/docs/guides/local-development/overview) 管理数据库 schema：

```bash
# 本地数据库重置（会清空数据，需 Docker）
npm run db:reset

# 关联远程项目后，将本地迁移推送到远程 Supabase 项目
npx supabase link --project-ref <project-ref>
npm run db:push
```

迁移文件位于 `supabase/migrations/` 目录。

### 可用脚本

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务
npm run lint     # 代码检查
npm run test     # 运行测试
npm run db:reset # 重置本地 Supabase 数据库（需 Docker）
npm run db:push  # 推送迁移至已关联的 Supabase 项目
```

## 项目结构

```
├── app/
│   ├── _components/    # 共享 UI 组件
│   ├── _lib/           # 工具库（BizException、错误处理等）
│   ├── _service/       # 业务逻辑层
│   ├── api/            # Route Handler (API 路由)
│   ├── auth/           # 认证回调路由
│   ├── chat/           # 聊天页面
│   └── login/          # 登录/注册页面
├── lib/
│   └── supabase/       # Supabase SSR 客户端工具
├── supabase/
│   └── migrations/     # 数据库迁移文件
├── data/               # 本地数据目录（Supabase 本地模拟使用）
└── deploy/             # 部署配置示例
```

## 部署

### 使用 Caddy + systemd

项目提供了 `deploy/` 目录下的部署配置示例：

- `Caddyfile.example` —— Caddy 反向代理配置
- `hello-next-js.service.example` —— systemd 服务单元

部署步骤请参考各文件中的注释说明。

## 了解更多

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Supabase SSR for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
