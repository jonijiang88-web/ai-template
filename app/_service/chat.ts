import { Message } from '../_entity/Message'
import { getChatRepo } from '../_repository/chat'

export async function getMessages() {
  const repo = await getChatRepo()
  return repo.find({ order: { id: 'ASC' } })
}

export async function sendMessage(content: string) {
  const repo = await getChatRepo()

  const userMsg = repo.create({ role: 'user', content })
  await repo.save(userMsg)

  const reply = `你说了: "${content}"`
  const botMsg = repo.create({ role: 'bot', content: reply })
  await repo.save(botMsg)

  return reply
}
