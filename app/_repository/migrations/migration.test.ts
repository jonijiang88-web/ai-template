import 'reflect-metadata'
import { describe, it, expect, beforeAll } from 'vitest'
import { DataSource } from 'typeorm'
import initSqlJs from 'sql.js'
import path from 'path'
import { InitializeSchema1720000000000 } from './1720000000000-InitializeSchema'

type SqlJsModule = Awaited<ReturnType<typeof initSqlJs>>
let SQL: SqlJsModule

beforeAll(async () => {
  SQL = await initSqlJs({
    locateFile: (file: string) =>
      path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  })
})

describe('SQLite 初始化迁移', () => {
  it('新数据库执行迁移后应存在 message 表且 userId 列非空', async () => {
    const dataSource = new DataSource({
      type: 'sqljs',
      database: new SQL.Database().export(),
      driver: SQL,
      entities: [],
      migrations: [InitializeSchema1720000000000],
      migrationsRun: true,
      logging: false,
    })
    await dataSource.initialize()

    // 验证：message 表已创建
    const tables: { name: string }[] = await dataSource.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='message'`,
    )
    expect(tables.length).toBe(1)

    // 验证：message 表包含 userId 列
    const columns: { name: string; notnull: number }[] = await dataSource.query(
      `PRAGMA table_info('message')`,
    )
    const userIdCol = columns.find((c) => c.name === 'userId')
    expect(userIdCol).toBeDefined()

    // 验证：userId 列带有 NOT NULL 约束（notnull === 1）
    expect(userIdCol!.notnull).toBe(1)

    await dataSource.destroy()
  })

  it('已有旧 message 表无 userId 时，迁移应添加该列并回填旧行 userId 为 __legacy__', async () => {
    // 创建不含 userId 列的旧版 message 表并写入一条消息
    const db = new SQL.Database()
    db.run(`CREATE TABLE message (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT (datetime('now'))
    )`)
    db.run(`INSERT INTO message (role, content) VALUES ('user', '这是一条旧消息')`)

    const dataSource = new DataSource({
      type: 'sqljs',
      database: db.export(),
      driver: SQL,
      entities: [],
      migrations: [InitializeSchema1720000000000],
      migrationsRun: true,
      logging: false,
    })
    await dataSource.initialize()

    // 验证：迁移后 userId 列已存在
    const columns: { name: string }[] = await dataSource.query(
      `PRAGMA table_info('message')`,
    )
    const userIdCol = columns.find((c) => c.name === 'userId')
    expect(userIdCol).toBeDefined()

    // 验证：旧有那一条消息的 userId 已被回填为 __legacy__
    const rows: { userId: string }[] = await dataSource.query(
      `SELECT userId FROM message`,
    )
    // 验证：旧消息行仍被保留，未在迁移中丢失
    expect(rows.length).toBe(1)
    // 验证：旧消息被标记为不可被真实用户访问的 legacy 归属
    expect(rows[0].userId).toBe('__legacy__')

    await dataSource.destroy()
  })

  it('重复执行迁移应幂等（不报错、不重复修改已有数据）', async () => {
    // 准备一个不含 userId 列的旧 message 表
    const db = new SQL.Database()
    db.run(`CREATE TABLE message (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT (datetime('now'))
    )`)
    db.run(
      `INSERT INTO message (role, content) VALUES ('user', '幂等测试消息')`,
    )

    // 第一次运行迁移
    const ds1 = new DataSource({
      type: 'sqljs',
      database: db.export(),
      driver: SQL,
      entities: [],
      migrations: [InitializeSchema1720000000000],
      migrationsRun: true,
      logging: false,
    })
    await ds1.initialize()

    // 验证：第一次迁移后 userId 列已添加且旧行值为 __legacy__
    const cols1: { name: string }[] = await ds1.query(
      `PRAGMA table_info('message')`,
    )
    expect(cols1.some((c) => c.name === 'userId')).toBe(true)
    const rows1: { userId: string }[] = await ds1.query(
      `SELECT userId FROM message`,
    )
    // 验证：第一次迁移后的旧消息已被隔离为 legacy 归属
    expect(rows1[0].userId).toBe('__legacy__')

    // 导出数据库快照（包含已记录的迁移状态）
    const dbSnapshot = (
      ds1.driver as unknown as { databaseConnection: { export(): Uint8Array } }
    ).databaseConnection.export()
    await ds1.destroy()

    // 第二次从同一份数据库快照运行迁移（应跳过已执行的迁移）
    await expect(
      (async () => {
        const ds2 = new DataSource({
          type: 'sqljs',
          database: dbSnapshot,
          driver: SQL,
          entities: [],
          migrations: [InitializeSchema1720000000000],
          migrationsRun: true,
          logging: false,
        })
        await ds2.initialize()

        // 验证：userId 列仍然存在且旧行值保持不变
        const cols2: { name: string }[] = await ds2.query(
          `PRAGMA table_info('message')`,
        )
        expect(cols2.some((c) => c.name === 'userId')).toBe(true)
        const rows2: { userId: string }[] = await ds2.query(
          `SELECT userId FROM message`,
        )
        // 验证：重复执行迁移不会改写已隔离的旧消息归属
        expect(rows2[0].userId).toBe('__legacy__')

        await ds2.destroy()
      })(),
    ).resolves.not.toThrow()
  })
})
