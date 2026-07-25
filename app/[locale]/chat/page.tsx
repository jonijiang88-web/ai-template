import { createClient } from '@/app/_lib/supabase/server'
import { redirect } from '@/app/_lib/i18n/navigation'
import { getLocale } from 'next-intl/server'
import ChatBox from './_components/ChatBox'

/**
 * /chat 页面 —— Server Component，使用 Supabase 服务端客户端鉴权。
 *
 * 如果用户未登录（auth.getUser() 无有效 session），重定向到 /login。
 * 已登录用户看到 ChatBox 客户端组件。
 */
export default async function ChatPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data?.user) {
    const locale = await getLocale()
    redirect({ href: '/login', locale })
  }

  return (
    <div className="flex flex-1">
      <ChatBox />
    </div>
  )
}
