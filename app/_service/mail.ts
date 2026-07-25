import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  return getResend().emails.send({
    from: process.env.MAIL_FROM ?? 'noreply@your-domain.com',
    to,
    subject,
    html,
  })
}
