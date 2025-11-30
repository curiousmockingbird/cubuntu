import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendSignUpVerificationEmail } from '@/lib/mailer'

const PREFIX = 'signup:'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name: string = String(body?.name || '').trim()
    const username: string | undefined = body?.username ? String(body.username).trim() : undefined
    const email: string = String(body?.email || '').toLowerCase().trim()
    const password: string = String(body?.password || '')

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: 'Name must be between 2 and 50 characters' }, { status: 400 })
    }
    if (username && (username.length < 3 || username.length > 32)) {
      return NextResponse.json({ error: 'Username must be between 3 and 32 characters' }, { status: 400 })
    }
    // Check conflicts
    const existingByEmail = await prisma.user.findUnique({ where: { email } })
    if (existingByEmail) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    if (username) {
      const existingByUsername = await prisma.user.findUnique({ where: { username } })
      if (existingByUsername) return NextResponse.json({ error: 'Username already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Cleanup any previous pending signups for this email only
    await prisma.verificationToken
      .deleteMany({ where: { identifier: { startsWith: `${PREFIX}${email}:` } } })
      .catch(() => {})

    const tokenRaw = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours

    const payload = { name, username: username || null, email, passwordHash }
    const identifier = `${PREFIX}${email}:${Buffer.from(JSON.stringify(payload)).toString('base64')}`

    // Store token in plain form for signup flow (time-limited, email-bound)
    await prisma.verificationToken.create({ data: { identifier, token: tokenRaw, expires } })

    const origin = new URL(req.url).origin
    const verifyUrl = `${origin}/verify?token=${encodeURIComponent(tokenRaw)}`
    await sendSignUpVerificationEmail(email, verifyUrl)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
