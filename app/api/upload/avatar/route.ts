import { createClient } from '@/app/_lib/supabase/server'
import { uploadAvatar, validateImage } from '@/app/_service/storage'
import { BizException } from '@/app/_lib/BizException'
import { withApiErrorHandler } from '@/app/_lib/api-error-handler'

/**
 * 上传头像。
 * 接受 multipart/form-data，字段名为 file。
 * 需登录，仅支持 jpeg/png/webp/gif，最大 5MB。
 */
async function postHandler(request?: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new BizException('UNAUTHORIZED', '未登录', 401)
  }

  if (!request) {
    throw new BizException('INVALID_JSON', '请求体不是合法的 JSON', 400)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    throw new BizException('INVALID_JSON', '请求体不是合法的 multipart/form-data', 400)
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    throw new BizException('VALIDATION_ERROR', '请上传头像图片', 400)
  }

  if (file.size === 0) {
    throw new BizException('VALIDATION_ERROR', '上传的文件为空', 400)
  }

  // 校验文件类型和大小
  const validationError = validateImage(file)
  if (validationError) {
    throw new BizException('VALIDATION_ERROR', validationError, 400)
  }

  const url = await uploadAvatar(user.id, file)

  return Response.json({ url })
}

/** POST /api/upload/avatar — 上传头像，需登录 */
export const POST = withApiErrorHandler(postHandler)
