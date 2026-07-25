'use client'

import { useEffect } from 'react'

/**
 * app/global-error.tsx — 全局级别的 Error Boundary。
 *
 * 覆盖根布局的错误，必须自带 {html}/{body} 标签。
 * 显示不泄漏 error.message 的英文简洁回退 UI，提供重试按钮，
 * 并在 effect 中 console.error 记录错误。
 * 内联样式遵循 Linear 风格：极简、紫色强调色 #5e6ad2。
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    // 仅记录安全摘要 { digest }，不输出 error.message 或完整 Error 对象
    console.error('[GlobalError] 捕获的异常:', { digest: error.digest })
  }, [error])

  return (
    <html
      lang="en"
      style={{
        height: '100%',
      }}
    >
      <body
        style={{
          margin: 0,
          height: '100%',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 8px',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#6b6b6b',
              margin: '0 0 24px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={unstable_retry}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#5e6ad2',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-in-out',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = '#4c56b0')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = '#5e6ad2')
            }
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  )
}
