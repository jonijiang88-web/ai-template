import 'reflect-metadata'
import { auth } from '../../_auth/auth'
import { getMessages, sendMessage } from '../../_service/chat'

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: '未登录' }, { status: 401 })

  const messages = await getMessages()
  return Response.json({ messages })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: '未登录' }, { status: 401 })

  const { message } = await request.json()
  const reply = await sendMessage(message)

  return Response.json({ reply })
}
