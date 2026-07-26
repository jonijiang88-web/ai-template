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

## 手动发版

需要发布新版本时，打 tag 推送到 GitHub，自动构建 APK + 创建 Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 自动做：

1. EAS 构建 Android APK
2. 创建 GitHub Release（含 Release Notes）

APK 在 Expo Dashboard 可下载。

### 首次设置

```bash
# 1. 登录 Expo（注册 https://expo.dev）
cd mobile
npx eas init

# 2. 生成 GitHub Token（Expo Dashboard → Account → Access Tokens）
#    加到 GitHub 仓库 Settings → Secrets and variables → Actions：
#    - EXPO_TOKEN: （Expo Access Token）
#    - EXPO_PUBLIC_API_BASE_URL: https://ai-template.jonijiang.cc
#    - NEXT_PUBLIC_SITE_URL: https://ai-template.jonijiang.cc
```

## 已知问题
