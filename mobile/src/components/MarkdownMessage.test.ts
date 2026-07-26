import { describe, expect, it } from 'vitest'
import { assistantMarkdownStyle } from './markdown-message-styles'
import {
  isSafeMarkdownLink,
  isSafeMarkdownLinkedImage,
} from './markdown-link'
import { designTokens } from '@ai-template/shared'
import { marked } from 'marked'

describe('assistantMarkdownStyle', () => {
  it('使用共享令牌渲染正文和强调文本', () => {
    const body = assistantMarkdownStyle.text
    const strong = assistantMarkdownStyle.strong

    // 验证：Markdown 正文沿用跨端共享的主文本色
    expect(body.color).toBe(designTokens.color.foreground)
    // 验证：Markdown 正文采用统一正文字号
    expect(body.fontSize).toBe(designTokens.fontSize.body)
    // 验证：加粗语法会以半粗字重显示
    expect(strong.fontWeight).toBe('600')
  })

  it('为列表和代码块提供可读的移动端样式', () => {
    const listItem = assistantMarkdownStyle.li
    const codeBlock = assistantMarkdownStyle.code

    // 验证：列表标记与正文之间保留固定间距
    expect(listItem.marginRight).toBe(designTokens.spacing.sm)
    // 验证：代码块使用共享面板背景区分普通文本
    expect(codeBlock.backgroundColor).toBe(designTokens.color.background)
    // 验证：代码块边框使用共享边框色
    expect(codeBlock.borderColor).toBe(designTokens.color.border)
  })

  it('仅允许安全的网页链接', () => {
    // 验证：HTTPS 链接可以在设备浏览器中打开
    expect(isSafeMarkdownLink('https://example.com/docs')).toBe(true)
    // 验证：HTTP 链接可以在设备浏览器中打开
    expect(isSafeMarkdownLink('http://example.com/docs')).toBe(true)
    // 验证：电话协议不会被 AI 回复触发
    expect(isSafeMarkdownLink('tel:+8613800000000')).toBe(false)
    // 验证：自定义协议不会被 AI 回复触发
    expect(isSafeMarkdownLink('myapp://settings')).toBe(false)
    // 验证：相对地址不会被当作设备外部链接打开
    expect(isSafeMarkdownLink('/internal-page')).toBe(false)
  })

  it('阻止图片包裹链接绕过协议白名单', () => {
    // 验证：安全图片及安全外层链接可以渲染
    expect(
      isSafeMarkdownLinkedImage('https://example.com/page', 'https://example.com/image.png'),
    ).toBe(true)
    // 验证：电话协议外层链接不会因安全图片而被放行
    expect(
      isSafeMarkdownLinkedImage('tel:+8613800000000', 'https://example.com/image.png'),
    ).toBe(false)
    // 验证：不安全图片地址不会因安全外层链接而被放行
    expect(
      isSafeMarkdownLinkedImage('https://example.com/page', 'file:///private/image.png'),
    ).toBe(false)
  })

  it('解析 AI 回复中的标题、加粗与列表语法', () => {
    const tokens = marked.lexer('# 标题\n\n**重点**\n\n- 第一项')
    const tokenTypes = tokens.map(token => token.type)
    const serializedTokens = JSON.stringify(tokens)

    // 验证：Markdown 标题会被识别为标题节点
    expect(tokenTypes).toContain('heading')
    // 验证：Markdown 列表会被识别为列表节点
    expect(tokenTypes).toContain('list')
    // 验证：Markdown 加粗会被识别为 strong 内联节点
    expect(serializedTokens).toContain('strong')
  })

  it('允许流式输出中的不完整 Markdown 持续解析', () => {
    // 验证：未闭合的加粗标记不会中断流式消息渲染
    expect(() => marked.lexer('正在生成 **未完成')).not.toThrow()
    // 验证：未闭合的代码块不会中断流式消息渲染
    expect(() => marked.lexer('```ts\nconst answer =')).not.toThrow()
  })
})
