import { getChatRepo } from '../_repository/chat'

/**
 * 获取指定用户的消息列表，按 id 升序排列。
 * @param userId - 用户唯一标识（当前使用 session.user.email）
 */
export async function getMessages(userId: string) {
  const repo = await getChatRepo()
  return repo.find({ where: { userId }, order: { id: 'ASC' } })
}

/**
 * 发送消息（创建 user 消息 + 自动回复 bot 消息），两条消息均绑定同一 userId。
 * @param userId - 用户唯一标识
 * @param content - 用户消息内容
 * @returns 机器人回复文本
 */
export async function sendMessage(userId: string, content: string) {
  const repo = await getChatRepo()

  const userMsg = repo.create({ role: 'user', content, userId })
  await repo.save(userMsg)

  const reply = `你说了: "${content}"`
  const botMsg = repo.create({ role: 'bot', content: reply, userId })
  await repo.save(botMsg)

  return reply
}
