import { uploadAvatar, validateImage } from '@/app/_service/storage'
import { BizException } from '@/app/_lib/BizException'
import { withApiErrorHandler } from '@/app/_lib/api-error-handler'
import {
  type AuthenticatedRequestContext,
  withAuthenticatedApiHandler,
} from '@/app/_lib/supabase/auth'
import { detectLocaleFromRequest } from '@/app/_lib/locale'
import { t } from '@/app/_lib/i18n/loader'

/**
 * 上传头像。
 * 接受 multipart/form-data，字段名为 file。
 * 需登录，仅支持 jpeg/png/webp/gif，最大 5MB。
 */
async function postHandler(
  { user }: AuthenticatedRequestContext,
  request: Request,
) {

  const locale = detectLocaleFromRequest(request)

  let formData: FormData
  try {
    formData = (await request.formData()) as unknown as FormData
  } catch {
    throw new BizException('INVALID_JSON', '请求体不是合法的 multipart/form-data', 400)
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    throw new BizException('VALIDATION_ERROR', t(locale, 'ApiError', 'UPLOAD_FILE_REQUIRED', '请上传头像图片'), 400)
  }

  if (file.size === 0) {
    throw new BizException('VALIDATION_ERROR', t(locale, 'ApiError', 'UPLOAD_FILE_EMPTY', '上传的文件为空'), 400)
  }

  // 校验文件类型和大小（传入 locale 以返回翻译后的消息）
  const validationError = validateImage(file, {}, locale)
  if (validationError) {
    throw new BizException('VALIDATION_ERROR', validationError, 400)
  }

  const url = await uploadAvatar(user.id, file)

  return Response.json({ url })
}

/** POST /api/upload/avatar — 上传头像，需登录 */
export const POST = withApiErrorHandler(withAuthenticatedApiHandler(postHandler))
