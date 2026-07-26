import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.137"],

  // 开发环境允许 Expo Web (localhost:8081) 跨域调 API
  async headers() {
    if (process.env.NODE_ENV !== 'development') return []

    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:8081' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
};

const withNextIntl = createNextIntlPlugin('./app/_lib/i18n/request.ts')

export default withNextIntl(nextConfig);
