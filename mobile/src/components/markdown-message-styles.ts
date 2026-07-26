import { designTokens } from '@ai-template/shared'
import type { MarkedStyles } from 'react-native-marked'

const { color, fontSize, radius, spacing } = designTokens

/** AI 回复 Markdown 的跨端共享视觉样式配置。 */
export const assistantMarkdownStyle = {
  text: {
    color: color.foreground,
    fontSize: fontSize.body,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  h1: {
    color: color.foreground,
    fontSize: fontSize.heading,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  h2: {
    color: color.foreground,
    fontSize: fontSize.title,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  h3: {
    color: color.foreground,
    fontSize: fontSize.label,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  strong: {
    fontWeight: '600',
  },
  list: {
    marginBottom: spacing.md,
  },
  li: {
    color: color.foreground,
    marginRight: spacing.sm,
  },
  blockquote: {
    backgroundColor: color.background,
    borderColor: color.border,
    borderLeftWidth: 3,
    marginLeft: 0,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  codespan: {
    backgroundColor: color.background,
    borderColor: color.border,
    borderRadius: radius.control,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
  },
  code: {
    backgroundColor: color.background,
    borderColor: color.border,
    borderRadius: radius.control,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  link: {
    color: color.accent,
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: color.border,
    marginBottom: spacing.md,
  },
} satisfies MarkedStyles
