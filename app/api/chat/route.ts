import 'reflect-metadata'
import { getDataSource } from '@/lib/data-source'
import { Message } from '@/lib/entity/Message'

async function getRepo() {
  const ds = await getDataSource()
  return ds.getRepository(Message)
}

export async function GET() {
  const repo = await getRepo()
  const messages = await repo.find({ order: { id: 'ASC' } })
  return Response.json({ messages })
}

export async function POST(request: Request) {
  const { message } = await request.json()
  const repo = await getRepo()

  const userMsg = repo.create({ role: 'user', content: message })
  await repo.save(userMsg)

  const reply = `你说了: "${message}"`

  const botMsg = repo.create({ role: 'bot', content: reply })
  await repo.save(botMsg)

  return Response.json({ reply })
}
