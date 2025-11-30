import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

const PREFIX = 'password_reset:'

export async function POST(req: Request) {
  try {
    const { email: raw } = await req.json()
    const email = String(raw || '').toLowerCase().trim()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Remove existing tokens for this identifier
      await prisma.verificationToken.deleteMany({ where: { identifier: PREFIX + email } }).catch(() => {})

      const tokenRaw = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex')
      const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

      await prisma.verificationToken.create({
        data: { identifier: PREFIX + email, token: tokenHash, expires },
      })

      const origin = new URL(req.url).origin
      const resetUrl = `${origin}/reset?token=${encodeURIComponent(tokenRaw)}`
      console.log('Password reset URL:', resetUrl)
      // Here you would send email containing resetUrl.
      // e.g., await sendMail({ to: email, subject: 'Reset your password', text: `Reset: ${resetUrl}` })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
