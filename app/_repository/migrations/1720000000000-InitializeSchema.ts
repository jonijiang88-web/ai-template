import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 初始化消息表迁移。
 *
 * 职责：
 * - 若 `message` 表不存在，则创建与 Message 实体完全一致的完整表结构。
 * - 若 `message` 表已存在但缺少 `userId` 列，则添加该列（NOT NULL），
 *   并将旧有行的 `userId` 自动回填为固定值 `__legacy__`，确保旧消息不会泄露给任何真实用户。
 *
 * 幂等性：无论执行多少次，结果始终一致，不会重复报错或破坏已有数据。
 */
export class InitializeSchema1720000000000 implements MigrationInterface {
  name = 'InitializeSchema1720000000000'

  /**
   * 创建新消息表，或将旧消息表升级为具备用户隔离字段的结构。
   * @param queryRunner - TypeORM 提供的 SQL 执行器
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    // 查询 message 表是否存在
    const tables = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='message'`,
    )

    if (tables.length === 0) {
      // 表不存在：创建与 Message 实体一致的完整表结构
      await queryRunner.query(`
        CREATE TABLE message (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          createdAt DATETIME DEFAULT (datetime('now'))
        )
      `)
      return
    }

    // 表已存在：检查是否已有 userId 列
    const columns: { name: string }[] = await queryRunner.query(
      `PRAGMA table_info('message')`,
    )
    const hasUserId = columns.some((col) => col.name === 'userId')

    if (!hasUserId) {
      // 添加 userId 列，NOT NULL + DEFAULT 使所有旧行自动获得 __legacy__
      await queryRunner.query(
        `ALTER TABLE message ADD COLUMN userId TEXT NOT NULL DEFAULT '__legacy__'`,
      )
    }
    // 若 userId 已存在，说明已迁移过，无需任何操作
  }

  /**
   * 回滚迁移。
   *
   * SQLite 不支持直接 DROP COLUMN（需重建整表），且 userId 列可能已承载用户数据，
   * 为安全起见，此操作为空操作。如需回退，请从备份的 `data/chat.db` 恢复。
   */
  async down(_queryRunner: QueryRunner): Promise<void> {
    void _queryRunner
    // 空操作 - 详见上方注释
  }
}
