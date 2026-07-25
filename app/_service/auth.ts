import { createAdminClient } from '@/app/_lib/supabase/admin'
import { sendEmail } from '@/app/_service/mail'
import { createHash, randomBytes } from 'crypto'
import { loadMessages } from '@/app/_lib/i18n/loader'

/**
 * 生成确认 token 并存储到 verification_tokens 表。
 */
async function createToken(email: string): Promise<string> {
  const supabase = createAdminClient()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h 后过期
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { error } = await supabase.from('verification_tokens').insert({
    email,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw error
  return token
}

/** 邮件确认页面的支持语言。 */
type ConfirmLocale = 'en' | 'zh-CN'

/**
 * 生成多语言确认邮件 HTML。
 * 文案从 next-intl 的 JSON 文件加载，与前端共享同一套翻译。
 */
function buildConfirmEmail(
  confirmUrl: string,
  locale: ConfirmLocale,
): { subject: string; html: string } {
  const msgs = loadMessages(locale)
  const subject = msgs.Email?.confirmSubject ?? 'Confirm your email address'
  const body = msgs.Email?.confirmBody ?? ''
  const buttonText = msgs.Email?.confirmButton ?? 'Confirm email'
  const footer = msgs.Email?.confirmFooter ?? ''

  return {
    subject,
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
        <tr><td style="padding:40px 32px 32px">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#1a1a1a">${subject}</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b6b6b">${body}</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#ea580c;border-radius:6px;padding:0">
                <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none">${buttonText}</a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 32px">
          <p style="margin:0;font-size:12px;color:#a0a0a0">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

/**
 * 注册并发送多语言确认邮件。
 *
 * 调用 Supabase Admin API 创建用户（不自动发邮件），
 * 然后通过 Resend 发送自定义多语言确认邮件。
 */
export async function signup(email: string, password: string, locale: ConfirmLocale = 'zh-CN') {
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  })

  if (error) throw error
  if (!data.user) throw new Error('创建用户失败')

  const token = await createToken(email)
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token=${token}&email=${encodeURIComponent(email)}&locale=${locale}`

  const { subject, html } = buildConfirmEmail(confirmUrl, locale)
  await sendEmail({ to: email, subject, html })

  return data.user
}

/**
 * 验证确认 token 并激活用户。
 */
export async function confirmEmail(token: string) {
  const supabase = createAdminClient()
  const tokenHash = createHash('sha256').update(token).digest('hex')

  // 查找 token
  const { data: rows, error: queryError } = await supabase
    .from('verification_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .gte('expires_at', new Date().toISOString())
    .limit(1)

  if (queryError) throw queryError
  if (!rows || rows.length === 0) {
    throw new Error('TOKEN_INVALID')
  }

  const record = rows[0]

  // 查找用户
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) throw userError

  const user = users.users.find(u => u.email === record.email)
  if (!user) throw new Error('USER_NOT_FOUND')

  // 激活用户
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  })
  if (updateError) throw updateError

  // 删除已使用的 token
  await supabase.from('verification_tokens').delete().eq('token_hash', tokenHash)

  return record.email
}
