# Next.js 16 最佳实践

## 项目结构

```
app/
├── layout.tsx            # 根布局（必需，含 <html>/<body>）
├── page.tsx              # 首页 /
├── loading.tsx           # 加载骨架（可选）
├── error.tsx             # 错误边界（可选）
├── not-found.tsx         # 404 页面（可选）
├── globals.css           # 全局样式
├── (marketing)/          # 路由组，不影响 URL
│   └── page.tsx
├── blog/
│   ├── layout.tsx        # 嵌套布局
│   ├── page.tsx          # /blog
│   └── [slug]/
│       └── page.tsx      # /blog/hello-world
├── api/
│   └── chat/
│       └── route.ts      # API 路由（后端接口）
└── _components/          # 私有文件夹，不可路由
    └── Button.tsx
```

## 核心原则

### 1. Server Component 优先

默认所有组件是 Server Component，只在需要交互时加 `'use client'`：

```tsx
// ✅ Server Component（默认）
export default async function Page() {
  const posts = await getPosts()
  return <PostList posts={posts} />
}

// ❌ 不需要 'use client' 就别加
// 'use client'
// export default function Page() { ... }
```

**什么时候用 Client Component**：
- `useState` / `useReducer` / `useRef`
- `onClick` / `onChange` 等事件
- `useEffect` 副作用
- `window` / `document` / `localStorage` 等浏览器 API
- 自定义 hooks

### 2. params / searchParams 是 Promise（v15+）

```tsx
// ✅ 必须 await
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q: string }>
}) {
  const { slug } = await params
  const { q } = await searchParams
}
```

### 3. 数据获取在哪用在哪取

```tsx
// ✅ 好的：组件自己取数据
async function BlogList() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  return posts.map(p => <Post key={p.id} {...p} />)
}

// ❌ 不好的：props 层层传递
// async function Page({ posts }: { posts: Post[] }) { ... }
```

相同请求会自动去重（memoization），不用担心重复请求。

### 4. 用 Link 代替 a 标签

```tsx
import Link from 'next/link'

// ✅ 客户端导航（预加载、无刷新）
<Link href="/blog">博客</Link>

// ❌ 会触发整页刷新
// <a href="/blog">博客</a>
```

### 5. 用 loading.tsx 和 Suspense

```tsx
// app/blog/loading.tsx — 整个页面段的加载状态
export default function Loading() {
  return <div className="animate-pulse">加载中...</div>
}

// 或者细粒度 Suspense
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
```

### 6. 图片用 next/image

```tsx
import Image from 'next/image'

// ✅ 自动优化、懒加载、响应式
<Image src="/avatar.png" alt="头像" width={100} height={100} />

// 外部图片需配置域名
// next.config.ts: images: { remotePatterns: [{ hostname: 'example.com' }] }
```

### 7. 环境变量约定

| 前缀 | 可用环境 |
|---|---|
| `NEXT_PUBLIC_*` | 浏览器和服务端 |
| 其他（如 `DB_KEY`） | 仅服务端 |

```bash
# .env.local（不提交 git）
API_KEY=sk-xxx
NEXT_PUBLIC_SITE_NAME=我的网站
```

### 8. API 路由

```tsx
// app/api/chat/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // 处理逻辑...
  return Response.json({ message: 'ok' })
}
```

### 9. 缓存策略

```tsx
// 启用缓存组件（next.config.ts）
// cacheComponents: true

// 缓存数据函数
async function getData() {
  'use cache'
  cacheLife('hours')
  return await fetch('https://api.example.com/data').then(r => r.json())
}
```

### 10. TypeScript 建议

- **组件类型**：用 `React.ReactNode` 表示 children
- **不用导出类型**：`PageProps<'/path'>` 和 `LayoutProps<'/path'>` 是全局可用的
- **严格模式**：`tsconfig.json` 保持 `strict: true`

```tsx
// 推荐：使用全局 PageProps
export default function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
}
```
