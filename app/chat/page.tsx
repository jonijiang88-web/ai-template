import { redirect } from 'next/navigation'
import { auth } from '../_auth/auth'
import ChatBox from './_components/ChatBox'

export default async function ChatPage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  return (
    <div className="flex flex-1">
      <ChatBox />
    </div>
  )
}
