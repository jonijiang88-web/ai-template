import 'react-native'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

/**
 * Supabase 客户端实例（React Native 版）。
 *
 * 使用 AsyncStorage 持久化 session，支持自动刷新 token。
 * anon key 是公开的（Web 端同样通过 NEXT_PUBLIC_ 暴露），
 * 数据安全靠 Supabase RLS 策略保障。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
