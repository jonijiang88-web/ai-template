import { Fragment, useMemo, type ReactNode } from 'react'
import { Linking, Text } from 'react-native'
import {
  Renderer,
  useMarkdown,
  type RendererInterface,
} from 'react-native-marked'
import type { ImageStyle, TextStyle } from 'react-native'
import { assistantMarkdownStyle } from './markdown-message-styles'
import {
  isSafeMarkdownLink,
  isSafeMarkdownLinkedImage,
} from './markdown-link'

export { assistantMarkdownStyle } from './markdown-message-styles'

interface MarkdownMessageProps {
  content: string
}

/** 受限 Markdown 渲染器，仅允许 AI 回复打开安全网页链接。 */
class SafeMarkdownRenderer extends Renderer implements RendererInterface {
  /** 将安全网页链接渲染为可点击文本，阻止设备协议链接。 */
  link(
    children: string | ReactNode[],
    href: string,
    styles?: TextStyle,
    title?: string,
  ): ReactNode {
    if (!isSafeMarkdownLink(href)) {
      return <Text key={this.getKey()} style={styles}>{children}</Text>
    }

    return (
      <Text
        accessibilityRole="link"
        accessibilityLabel={title || '链接'}
        key={this.getKey()}
        onPress={() => {
          void Linking.openURL(href).catch(() => {})
        }}
        style={styles}
      >
        {children}
      </Text>
    )
  }

  /** 仅渲染安全网页图片，避免从不受信任协议加载资源。 */
  image(uri: string, alt?: string, style?: ImageStyle, title?: string): ReactNode {
    return isSafeMarkdownLink(uri) ? super.image(uri, alt, style, title) : null
  }

  /** 仅在图片与外层链接均安全时保留可点击图片。 */
  linkImage(
    href: string,
    imageUrl: string,
    alt?: string,
    style?: ImageStyle,
    title?: string | null,
  ): ReactNode {
    return isSafeMarkdownLinkedImage(href, imageUrl)
      ? super.linkImage(href, imageUrl, alt, style, title ?? undefined)
      : null
  }
}

/** 将 AI 回复中的 Markdown 解析为原生移动端组件。 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const renderer = useMemo(() => new SafeMarkdownRenderer(), [])
  const elements = useMarkdown(content, {
    renderer,
    styles: assistantMarkdownStyle,
  })

  return <>{elements.map((element, index) => <Fragment key={index}>{element}</Fragment>)}</>
}
