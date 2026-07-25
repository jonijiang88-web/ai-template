import { describe, expect, it } from 'vitest'
import { getSafeNextPath } from './route'

describe('认证回调跳转地址', () => {
  it('接受站内相对路径', () => {
    // 验证：站内相对路径会被原样保留
    expect(getSafeNextPath('/chat?source=email')).toBe('/chat?source=email')
  })

  it('拒绝协议相对地址', () => {
    // 验证：协议相对地址不能作为回调目标，避免跳转到外部站点
    expect(getSafeNextPath('//evil.example')).toBe('/chat')
  })

  it('拒绝绝对地址和空值', () => {
    // 验证：绝对地址会回退至默认聊天页
    expect(getSafeNextPath('https://evil.example')).toBe('/chat')
    // 验证：缺省地址会回退至默认聊天页
    expect(getSafeNextPath(null)).toBe('/chat')
  })
})
