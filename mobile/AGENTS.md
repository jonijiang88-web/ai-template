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

## 运行时配置

移动端公开配置维护在 `src/lib/runtime-config.ts`，未提供环境变量时使用内置生产配置。

本地联调可创建 `.env.local` 覆盖 API 地址：

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
```

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

```

## 已知问题
