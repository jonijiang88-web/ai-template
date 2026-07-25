import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    // 仅测试 Route Handler，无需 jsdom 环境
    environment: 'node',
    include: ['app/**/*.test.ts'],
  },
})
