import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Message } from './entity/Message'
import path from 'path'

let dataSource: DataSource | null = null

export async function getDataSource(): Promise<DataSource> {
  if (!dataSource) {
    dataSource = new DataSource({
      type: 'sqljs',
      location: path.join(process.cwd(), 'data', 'chat.db'),
      synchronize: true,
      logging: false,
      entities: [Message],
    })
    await dataSource.initialize()
  }
  return dataSource
}
