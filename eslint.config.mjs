import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import vitest from '@vitest/eslint-plugin'

const supabaseSdkImports = [
  {
    name: '@supabase/supabase-js',
    allowTypeImports: true,
    message: '请通过 app/_lib/supabase 封装访问 Supabase 客户端。',
  },
  {
    name: '@supabase/ssr',
    message: '请通过 app/_lib/supabase 封装访问 Supabase SSR 客户端。',
  },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    ...vitest.configs.recommended,
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-disabled-tests': 'error',
      'vitest/no-conditional-tests': 'error',
    },
  },
  {
    files: ['app/**/*.{ts,tsx}'],
    ignores: ['app/_lib/supabase/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: supabaseSdkImports }],
    },
  },
  {
    files: [
      'app/api/**/*.{ts,tsx}',
      'app/auth/**/*.{ts,tsx}',
      'app/[[]locale[]]/layout.tsx',
      'app/[[]locale[]]/page.tsx',
      'app/[[]locale[]]/chat/page.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...supabaseSdkImports,
            {
              name: '@/app/_lib/supabase/client',
              message: '服务端代码不得导入浏览器 Supabase 客户端。',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'app/_components/**/*.{ts,tsx}',
      'app/[[]locale[]]/login/**/*.{ts,tsx}',
      'app/[[]locale[]]/chat/_components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...supabaseSdkImports,
            {
              name: '@/app/_lib/supabase/server',
              message: '客户端组件不得导入服务端 Supabase 客户端。',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
