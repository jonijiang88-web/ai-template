import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Message } from '../_entity/Message'
import { InitializeSchema1720000000000 } from './migrations/1720000000000-InitializeSchema'
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'chat.db')

let dataSource: DataSource | null = null

export async function getDataSource(): Promise<DataSource> {
  if (!dataSource) {
    const SQL = await initSqlJs({
      locateFile: (file: string) =>
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    })
    let database: Uint8Array | undefined
    if (fs.existsSync(DB_PATH)) {
      database = fs.readFileSync(DB_PATH)
    }

    dataSource = new DataSource({
      type: 'sqljs',
      database,
      driver: SQL,
      logging: false,
      entities: [Message],
      migrations: [InitializeSchema1720000000000],
      migrationsRun: true,
      autoSave: true,
      location: DB_PATH,
    })
    await dataSource.initialize()
  }
  return dataSource
}
