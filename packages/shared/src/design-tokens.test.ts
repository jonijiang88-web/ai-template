import { describe, expect, it } from 'vitest'
import { designTokenCss, designTokens } from './design-tokens'

describe('designTokens', () => {
  it('为 Web 与移动端提供一致的品牌强调色', () => {
    // 验证：强调色符合 Linear 视觉规范
    expect(designTokens.color.accent).toBe('#c2410c')
    // 验证：Web 使用的 CSS 变量来自同一强调色
    expect(designTokenCss).toContain('--accent: #c2410c;')
  })

  it('定义控件和消息气泡的统一圆角', () => {
    // 验证：输入框与按钮使用紧凑圆角
    expect(designTokens.radius.control).toBe(6)
    // 验证：消息气泡使用卡片圆角
    expect(designTokens.radius.card).toBe(8)
  })
})
