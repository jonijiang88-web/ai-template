import { Repository } from 'typeorm'
import { Message } from '../_entity/Message'
import { getDataSource } from './datasource'

export async function getChatRepo(): Promise<Repository<Message>> {
  const ds = await getDataSource()
  return ds.getRepository(Message)
}
