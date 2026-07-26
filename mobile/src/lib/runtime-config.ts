/** 移动端运行时需要的公开配置。 */
export interface RuntimeConfig {
  supabaseUrl: string
  supabasePublishableKey: string
  apiBaseUrl: string
}

const runtimeConfig: RuntimeConfig = {
  supabaseUrl: 'https://auuhpxgbaniywinqfoah.supabase.co',
  supabasePublishableKey: 'sb_publishable_bX1Nb2IaGuG_ChR5-kZfCQ_T4Ev2wSb',
  apiBaseUrl: 'https://ai-template.jonijiang.cc',
}

/** 返回本地环境变量优先、内置配置兜底的公开运行时配置。 */
export function getRuntimeConfig(
  environment: Record<string, string | undefined> = process.env,
): RuntimeConfig {
  return {
    supabaseUrl: environment.EXPO_PUBLIC_SUPABASE_URL || runtimeConfig.supabaseUrl,
    supabasePublishableKey:
      environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || runtimeConfig.supabasePublishableKey,
    apiBaseUrl: environment.EXPO_PUBLIC_API_BASE_URL || runtimeConfig.apiBaseUrl,
  }
}
