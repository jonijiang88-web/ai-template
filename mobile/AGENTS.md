# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## 启动

**需要同时跑两个终端：**

### 终端 1：API 后端

```bash
# 项目根目录
npm run dev
```

### 终端 2：Expo APP

```bash
cd mobile

# Web 模式（推荐快速调试，浏览器 F12 即可）
npx expo start --web

# 真机模式（Expo Go 扫码）
npx expo start
```

## 环境变量

复制模板并填入真实值：

```bash
cp .env.example .env.local
```

关键变量：

| 变量 | 说明 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 项目地址 |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `EXPO_PUBLIC_API_BASE_URL` | Next.js 后端地址（真机调试时需填电脑局域网 IP，如 `http://192.168.1.100:3000`） |
