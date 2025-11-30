import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const PREFIX = 'password_reset:'

export async function POST(req: Request) {
  try {
    const { token: tokenRaw, password } = await req.json()
    const token = String(tokenRaw || '')
    const pwd = String(password || '')

    if (!token || !pwd) return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
    if (pwd.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const vt = await prisma.verificationToken.findFirst({ where: { token: tokenHash } })
    if (!vt) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

    if (vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (!vt.identifier.startsWith(PREFIX)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const email = vt.identifier.slice(PREFIX.length)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(pwd, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}