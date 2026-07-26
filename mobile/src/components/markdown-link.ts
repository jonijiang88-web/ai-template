/** 判断 Markdown 链接是否允许在设备上打开。 */
export function isSafeMarkdownLink(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/** 判断图片及其外层 Markdown 链接是否都允许渲染。 */
export function isSafeMarkdownLinkedImage(href: string, imageUrl: string): boolean {
  return isSafeMarkdownLink(href) && isSafeMarkdownLink(imageUrl)
}
