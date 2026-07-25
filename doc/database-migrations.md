# 数据库迁移

## 概览

项目使用 [TypeORM Migration](https://typeorm.io/migrations) 管理 SQLite 数据库（`data/chat.db`）的 schema 变更。

## 重要：生产部署前请备份

在执行任何部署之前，**务必先备份数据库文件**：

```bash
cp data/chat.db data/chat.db.$(date +%Y%m%d_%H%M%S).bak
```

## 迁移如何工作

应用启动时，`getDataSource()` 会：

1. 加载 SQLite 数据库文件 `data/chat.db`（如果存在）
2. 自动检查并执行所有尚未在 `migrations` 元数据表中注册的迁移
3. 迁移执行完毕后正常提供服务

这是通过以下配置实现的：

- **`migrationsRun: true`** — 每次初始化时自动运行未执行的迁移
- **`migrations: [...]`** — 注册的迁移类列表

## 当前迁移清单

| 迁移文件 | 类名 | 说明 |
|---|---|---|
| `1720000000000-InitializeSchema.ts` | `InitializeSchema1720000000000` | 首次迁移：创建 `message` 表或为旧表添加 `userId` 列 |

### 1720000000000-InitializeSchema

该迁移处理两种场景：

**场景 A：数据库为空（无 `message` 表）**
- 创建与 `Message` 实体一致的完整表结构
- 包含 `id`, `userId` (NOT NULL), `role`, `content`, `createdAt`

**场景 B：数据库存在旧版 `message` 表（无 `userId` 列）**
- 添加 `userId TEXT NOT NULL DEFAULT '__legacy__'` 列
- 已有行的 `userId` 自动设为 `__legacy__`
- 该值不会被任何正常用户登录流程产生，因此旧消息不会泄露给真实用户

## 旧消息隔离策略

添加 `userId` 列时，使用 `NOT NULL DEFAULT '__legacy__'`：

- 旧行自动获得 `userId = '__legacy__'`
- 当前 [Credentials Provider](../app/_auth/auth.ts) 使用 `session.user.email` 作为 `userId`，无法生成 `__legacy__` 值
- 业务层（`getMessages(userId)`）按 `userId` 查询，因此旧消息不会出现在任何用户的对话中
- 数据未被删除，可通过手动查询 `SELECT * FROM message WHERE userId = '__legacy__'` 恢复

## 禁止恢复 synchronize

**不要**将 `datasource.ts` 中的配置改回 `synchronize: true`。原因：

| 方式 | 风险 |
|---|---|
| `synchronize: true` | 每次启动自动对齐实体定义，可能意外删除列或数据；不记录变更历史；无法回滚 |
| Migration | 精确控制每次变更；记录执行历史；可回滚（理论上，SQLite 的 DROP COLUMN 有限制） |

## 添加新迁移

```bash
# 1. 在 app/_repository/migrations/ 下创建新文件
touch app/_repository/migrations/1730000000000-YourMigrationName.ts

# 2. 实现 MigrationInterface（up / down）
# 3. 在 datasource.ts 的 migrations 数组中注册
# 4. 编写迁移集成测试
# 5. 运行测试验证
npx vitest run app/_repository/migrations/
```

## 故障排查

- **迁移执行失败**：检查 `data/chat.db` 的读写权限，确保没有其他进程锁定数据库
- **需要回退迁移**：从备份文件恢复数据库，然后在代码中移除或调整有问题的迁移
- **`migrations` 表损坏**：TypeORM 使用内置的 `migrations` 表追踪已执行的迁移。如果该表不一致，可备份数据后删除 `migrations` 表重新运行所有迁移
