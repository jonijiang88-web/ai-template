import { Redirect } from 'expo-router'

/**
 * 根路由 —— 直接重定向到聊天页。
 * 用户打开 APP 即进入聊天界面，无需首页。
 */
export default function Index() {
  return <Redirect href="/chat" />
}
