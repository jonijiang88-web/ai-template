'use client'

import { useEffect } from 'react'

/**
 * app/error.tsx — 路由段级别的 Error Boundary。
 *
 * 在发生渲染异常时显示简洁的英文回退 UI，不泄漏原始错误详情。
 * 提供重试按钮，调用 unstable_retry 恢复渲染。
 */
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    // 仅记录安全摘要 { digest }，不输出 error.message 或完整 Error 对象
    console.error('[ErrorPage] 捕获的异常:', { digest: error.digest })
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '24px',
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
  )
}
