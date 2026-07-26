/** Web 与移动端共享的 Linear 视觉设计令牌。 */
export const designTokens = {
  color: {
    background: '#ffffff',
    panel: '#f8f8f8',
    foreground: '#1a1a1a',
    muted: '#6b6b6b',
    placeholder: '#a0a0a0',
    border: '#e5e5e5',
    accent: '#c2410c',
    accentHover: '#9a3412',
    success: '#22c55e',
    danger: '#ef4444',
    dangerSurface: '#fef2f2',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    control: 6,
    card: 8,
    overlay: 12,
  },
  fontSize: {
    caption: 12,
    body: 14,
    label: 16,
    title: 20,
    heading: 24,
  },
} as const

/** 将共享设计令牌转换为 Web 使用的 CSS 自定义属性。 */
export const designTokenCss = `:root {
  --background: ${designTokens.color.background};
  --foreground: ${designTokens.color.foreground};
  --panel: ${designTokens.color.panel};
  --muted: ${designTokens.color.muted};
  --placeholder: ${designTokens.color.placeholder};
  --border: ${designTokens.color.border};
  --accent: ${designTokens.color.accent};
  --accent-hover: ${designTokens.color.accentHover};
  --success: ${designTokens.color.success};
  --danger: ${designTokens.color.danger};
}`
