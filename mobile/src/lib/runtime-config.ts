/** 移动端运行时需要的公开配置。 */
export interface RuntimeConfig {
  supabaseUrl: string
  supabasePublishableKey: string
  apiBaseUrl: string
}

/** 读取并校验 Expo 在构建时注入的公开环境变量。 */
export function getRuntimeConfig(
  environment: Record<string, string | undefined> = process.env,
): RuntimeConfig {
  const supabaseUrl = environment.EXPO_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const apiBaseUrl = environment.EXPO_PUBLIC_API_BASE_URL
  const missingVariables = [
    !supabaseUrl && 'EXPO_PUBLIC_SUPABASE_URL',
    !supabasePublishableKey && 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    !apiBaseUrl && 'EXPO_PUBLIC_API_BASE_URL',
  ].filter(Boolean)

  if (missingVariables.length > 0) {
    throw new Error(`缺少运行时配置：${missingVariables.join('、')}`)
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabasePublishableKey: supabasePublishableKey!,
    apiBaseUrl: apiBaseUrl!,
  }
}
