import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../src/contexts/AuthContext'
import { designTokens } from '@ai-template/shared'

type Mode = 'login' | 'signup'
const { color, fontSize, radius, spacing } = designTokens

/**
 * 登录/注册页面。
 *
 * 包含登录和注册两个 tab，使用邮箱 + 密码认证。
 * 登录成功后自动跳转到聊天页（由 _layout.tsx 的路由守卫处理）。
 */
export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('提示', '请输入邮箱和密码')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
        Alert.alert('注册成功', '请查看邮箱中的确认邮件')
        setMode('login')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '操作失败，请重试'
      Alert.alert('错误', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>AI Chat</Text>
          <Text style={styles.subtitle}>登录以开始聊天</Text>

          {/* Tab 切换 */}
          <View style={styles.tabRow}>
            <Pressable
              style={({ pressed }) => [
                styles.tab,
                mode === 'login' && styles.tabActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                登录
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.tab,
                mode === 'signup' && styles.tabActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                注册
              </Text>
            </Pressable>
          </View>

          {/* 表单 */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="邮箱"
            placeholderTextColor={color.placeholder}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="密码"
            placeholderTextColor={color.placeholder}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'login' ? 'password' : 'new-password'}
            editable={!loading}
          />

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              pressed && !loading && styles.submitButtonPressed,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={color.background} size="small" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'login' ? '登录' : '注册'}
              </Text>
            )}
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
  inner: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: '600',
    textAlign: 'center',
    color: color.foreground,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.body,
    textAlign: 'center',
    color: color.muted,
    marginBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: color.panel,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.control,
  },
  tabActive: {
    backgroundColor: color.background,
  },
  tabText: {
    fontSize: fontSize.body,
    fontWeight: '500',
    color: color.muted,
  },
  tabTextActive: {
    color: color.accent,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    marginBottom: spacing.md,
    backgroundColor: color.background,
  },
  submitButton: {
    backgroundColor: color.accent,
    borderRadius: radius.control,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: color.background,
    fontSize: fontSize.label,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.72,
  },
  submitButtonPressed: {
    backgroundColor: color.accentHover,
    transform: [{ scale: 0.97 }],
  },
})
