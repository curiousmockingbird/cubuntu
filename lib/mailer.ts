export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    console.warn('Resend not configured: missing RESEND_API_KEY or RESEND_FROM_EMAIL')
    return
  }

  const subject = 'Reset your password'
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
      <h2>Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to set a new one.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 10px 16px; text-decoration: none; border-radius: 6px; display: inline-block;">Set new password</a>
      </p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color:#2563eb;">${resetUrl}</p>
      <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `
  const text = `Reset your password\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can ignore this email.`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      console.error('Resend email error', res.status, msg)
    }
  } catch (err) {
    console.error('Resend email fetch failed', err)
  }
}

