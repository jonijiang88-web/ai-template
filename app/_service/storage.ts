import { createAdminClient } from '@/app/_lib/supabase/admin'
import { loadMessages } from '@/app/_lib/i18n/loader'

/** 公开可读的存储桶名称。 */
const AVATARS_BUCKET = 'avatars'

/** 允许的头像 MIME 类型。 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** 头像文件大小上限（5MB）。 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/** 头像文件名前缀（用于文件夹隔离）。 */
const AVATAR_FOLDER = 'public' // 所有头像统一放在 public 文件夹下

/** 上传图片的校验选项。 */
export type ImageValidation = {
  allowedTypes?: string[]
  maxSize?: number
}

/**
 * 校验上传的文件。
 *
 * @param file       - 上传的文件
 * @param validation - 校验规则
 * @param locale     - 语言代码（zh-CN / en），用于返回翻译后的错误消息
 * @returns 校验通过返回 null，否则返回翻译后的错误消息
 */
export function validateImage(
  file: File,
  validation: ImageValidation = {},
  locale: string = 'zh-CN',
): string | null {
  const allowedTypes = validation.allowedTypes ?? ALLOWED_MIME_TYPES
  const maxSize = validation.maxSize ?? MAX_FILE_SIZE
  const msgs = loadMessages(locale)

  if (!allowedTypes.includes(file.type)) {
    const template = msgs.ApiError?.UPLOAD_INVALID_TYPE ?? 'Unsupported file format. Supported: {types}'
    return template.replace('{types}', allowedTypes.join(', '))
  }

  if (file.size > maxSize) {
    const mb = maxSize / 1024 / 1024
    const template = msgs.ApiError?.UPLOAD_FILE_TOO_LARGE ?? 'File size exceeds limit (max {size}MB)'
    return template.replace('{size}', String(mb))
  }

  return null
}

/**
 * 确保存储桶存在。如果不存在则创建。
 */
async function ensureBucket(bucket: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, {
      public: true, // 头像需要公开可读
    })
  }
}

/**
 * 上传头像到 Supabase Storage。
 * 文件自动按用户 ID 隔离存放。
 * 调用前请先通过 validateImage 校验文件。
 *
 * @param userId - 用户 UUID
 * @param file   - 上传的图片文件
 * @returns 公开可访问的头像 URL
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {

  await ensureBucket(AVATARS_BUCKET)

  // 生成安全的文件名：userId-时间戳.扩展名
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${AVATAR_FOLDER}/${userId}-${Date.now()}.${ext}`

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true, // 同一个用户多次上传覆盖旧文件
    })

  if (error) {
    throw new Error(`上传失败：${error.message}`)
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * 删除用户头像。
 *
 * @param userId - 用户 UUID
 */
export async function deleteAvatar(userId: string): Promise<void> {
  const supabase = createAdminClient()
  // 列出用户的所有头像文件并删除
  const { data: files } = await supabase.storage
    .from(AVATARS_BUCKET)
    .list(AVATAR_FOLDER, { search: userId })

  if (files && files.length > 0) {
    const paths = files.map(f => `${AVATAR_FOLDER}/${f.name}`)
    await supabase.storage.from(AVATARS_BUCKET).remove(paths)
  }
}
