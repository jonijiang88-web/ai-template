import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { ApiClient, generateId } from '@ai-template/shared'
import type { ChatMessage } from '@ai-template/shared'
import { designTokens } from '@ai-template/shared'
import { useAuth } from '../src/contexts/AuthContext'
import { canSendChatMessage } from '../src/lib/chat-state'

/** API 基础地址，通过环境变量配置，默认指向本地开发服务器 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
const { color, fontSize, radius, spacing } = designTokens

/**
 * 聊天页面组件。
 *
 * 功能：
 * - 自动获取 session token 传递给 API
 * - 加载历史消息
 * - 发送消息并接收 AI 回复
 * - 消息列表自动滚动到最新
 */
export default function ChatScreen() {
  const { session } = useAuth()
  const [apiClient] = useState(
    () => new ApiClient(API_BASE_URL, session?.access_token ?? null),
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const flatListRef = useRef<FlatList>(null)
  const historyLoaded = useRef(false)

  // session 更新时同步到 apiClient
  useEffect(() => {
    apiClient.setToken(session?.access_token ?? null)
  }, [session, apiClient])

  // 加载历史消息（仅首次）
  useEffect(() => {
    if (historyLoaded.current) return
    historyLoaded.current = true
    apiClient
      .getMessages()
      .then(data => {
        if (data.length > 0) {
          setMessages(data)
        }
      })
      .catch(() => {
        // 静默失败，空聊天也可以继续
      })
      .finally(() => {
        setIsHistoryLoading(false)
      })
  }, [apiClient])

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!canSendChatMessage(text, isHistoryLoading, isStreaming)) return

    setInput('')
    setError(null)

    // 添加用户消息到列表
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const allMessages = [...messages, userMsg]

      // 临时 assistant 消息占位
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
      setIsLoading(false)
      setIsStreaming(true)

      // 流式更新：每收到一段 delta 就追加到 assistant 消息
      let accumulated = ''
      const reply = await apiClient.sendMessage(allMessages, (chunk) => {
        accumulated += chunk
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id ? { ...m, content: accumulated } : m,
          ),
        )
      })

      // 确保最终内容完整
      if (reply !== accumulated) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id ? { ...m, content: reply } : m,
          ),
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [input, isHistoryLoading, isStreaming, messages, apiClient])

  const canSend = canSendChatMessage(input, isHistoryLoading, isStreaming)

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>开始聊天吧</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
                {item.content}
                {isStreaming &&
                  item.role === 'assistant' &&
                  item.content === '' && (
                    <Text style={styles.cursor}>▊</Text>
                  )}
              </Text>
            </View>
          )}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={color.muted} />
            <Text style={styles.loadingText}>AI 思考中…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="输入消息…"
            placeholderTextColor={color.placeholder}
            style={styles.input}
            multiline
            editable={!isHistoryLoading && !isStreaming}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
              pressed && canSend && styles.sendButtonPressed,
            ]}
          >
            <Text style={styles.sendButtonText}>发送</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: fontSize.body,
    color: color.placeholder,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  userBubble: {
    backgroundColor: color.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: radius.control,
  },
  assistantBubble: {
    backgroundColor: color.panel,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
  },
  userText: {
    color: color.background,
    fontSize: fontSize.body,
    lineHeight: 22,
  },
  assistantText: {
    color: color.foreground,
    fontSize: fontSize.body,
    lineHeight: 22,
  },
  cursor: {
    color: color.accent,
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.caption,
    color: color.muted,
  },
  errorContainer: {
    backgroundColor: color.dangerSurface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    color: color.danger,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    backgroundColor: color.panel,
  },
  input: {
    flex: 1,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    maxHeight: 100,
    backgroundColor: color.background,
  },
  sendButton: {
    marginLeft: spacing.sm,
    backgroundColor: color.accent,
    borderRadius: radius.control,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: color.background,
    fontSize: fontSize.body,
    fontWeight: '500',
  },
  sendButtonPressed: {
    backgroundColor: color.accentHover,
    transform: [{ scale: 0.97 }],
  },
})
