import { describe, it, expect } from 'vitest'
import { validateImage } from './storage'

describe('validateImage', () => {
  it('允许的图片类型返回 null', () => {
    // 验证：jpeg 图片通过校验
    const file = new File(['fake'], 'avatar.jpg', { type: 'image/jpeg' })
    expect(validateImage(file)).toBeNull()
  })

  it('不允许的文件类型返回错误', () => {
    // 验证：txt 文件被拒绝
    const file = new File(['text'], 'file.txt', { type: 'text/plain' })
    expect(validateImage(file)).not.toBeNull()
  })

  it('超过大小限制返回错误', () => {
    // 验证：超出 1KB 限制时拒绝
    const largeContent = new Uint8Array(1025)
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
    const result = validateImage(file, { maxSize: 1024 })
    expect(result).not.toBeNull()
  })

  it('允许自定义校验规则', () => {
    // 验证：只允许 PNG 时，JPEG 被拒绝
    const file = new File(['fake'], 'avatar.jpg', { type: 'image/jpeg' })
    const result = validateImage(file, { allowedTypes: ['image/png'] })
    expect(result).not.toBeNull()
  })
})
