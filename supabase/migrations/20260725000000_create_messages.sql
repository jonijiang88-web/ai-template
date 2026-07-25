-- ============================================================
-- 迁移 000001：创建 public.messages 表及行级安全策略
-- 幂等设计：所有 CREATE / DROP 均使用 IF EXISTS / IF NOT EXISTS
-- ============================================================

-- 创建 messages 表（若不存在）
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 4000),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 创建按 user_id + created_at 的索引（加速按用户查询并按时间排序）
-- 若索引已存在则不重复创建
CREATE INDEX IF NOT EXISTS idx_messages_user_id_created_at
    ON public.messages (user_id, created_at);

-- 启用行级安全（幂等：多次执行无副作用）
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- === 策略：SELECT ===
-- 已认证用户仅可查看 user_id = 自己的消息
DROP POLICY IF EXISTS "用户只能查看自己的消息" ON public.messages;
CREATE POLICY "用户只能查看自己的消息"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- === 策略：INSERT ===
-- 已认证用户仅可插入 user_id = 自己的消息
DROP POLICY IF EXISTS "用户只能插入自己的消息" ON public.messages;
CREATE POLICY "用户只能插入自己的消息"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
