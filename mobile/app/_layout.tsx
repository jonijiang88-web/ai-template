import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { designTokens } from '@ai-template/shared'

const { color } = designTokens

/**
 * 根布局 —— 包裹 AuthProvider，添加路由守卫。
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: color.background },
            headerTintColor: color.foreground,
            headerTitleStyle: { fontWeight: '600', color: color.foreground },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="login"
            options={{ title: '登录', headerShown: false }}
          />
          <Stack.Screen
            name="chat"
            options={{ title: 'AI 聊天', headerShown: true }}
          />
        </Stack>
      </AuthGate>
    </AuthProvider>
  )
}

/**
 * 路由守卫 —— 未登录时重定向到 /login。
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return

    const isLoginPage = segments[0] === 'login'
    if (!user && !isLoginPage) {
      // 未登录且不在登录页 → 跳转到登录
      router.replace('/login')
    } else if (user && isLoginPage) {
      // 已登录且在登录页 → 跳转到聊天
      router.replace('/chat')
    }
  }, [user, loading, segments, router])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color.accent} />
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.background,
  },
})
