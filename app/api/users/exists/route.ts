import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const emailRaw = searchParams.get('email')
  const usernameRaw = searchParams.get('username')

  if (!emailRaw && !usernameRaw) {
    return NextResponse.json({ error: 'Missing query param: email or username' }, { status: 400 })
  }

  try {
    if (emailRaw) {
      const email = emailRaw.toLowerCase().trim()
      if (!email) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
      const user = await prisma.user.findUnique({ where: { email } })
      return NextResponse.json({ exists: !!user, hasPassword: !!user?.passwordHash })
    }

    if (usernameRaw) {
      const username = usernameRaw.trim()
      if (!username) return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
      const user = await prisma.user.findUnique({ where: { username } })
      return NextResponse.json({ exists: !!user })
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
