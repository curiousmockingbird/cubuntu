import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
const PREFIX = 'signup:'

export async function POST(req: Request) {
  try {
    const { token: tokenRaw } = await req.json()
    const token = String(tokenRaw || '')
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    // Find by raw token for signup flow
    const vt = await prisma.verificationToken.findFirst({ where: { token } })
    if (!vt) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

    if (vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (!vt.identifier.startsWith(PREFIX)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Parse payload
    const after = vt.identifier.slice(PREFIX.length)
    const [emailPart, encoded] = after.split(':', 2)
    let payload: { name: string; username: string | null; email: string; passwordHash: string }
    try {
      payload = JSON.parse(Buffer.from(encoded || '', 'base64').toString('utf8'))
    } catch {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 })
    }

    if (!emailPart || payload.email !== emailPart) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Re-check conflicts at verification time
    const existsEmail = await prisma.user.findUnique({ where: { email: payload.email } })
    if (existsEmail) {
      // Idempotent behavior: if the account for this email already exists,
      // treat verification as successful and consume the token.
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})
      return NextResponse.json({ ok: true })
    }
    if (payload.username) {
      const existsUsername = await prisma.user.findUnique({ where: { username: payload.username } })
      if (existsUsername) {
        // Do not delete token to allow retry later with different username (requires new sign-up)
        return NextResponse.json({ error: 'Username already in use' }, { status: 409 })
      }
    }

    await prisma.user.create({
      data: {
        name: payload.name,
        username: payload.username,
        email: payload.email,
        passwordHash: payload.passwordHash,
      },
    })

    // Consume token
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: vt.identifier, token: vt.token } } }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
