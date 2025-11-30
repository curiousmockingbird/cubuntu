import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const emailRaw = searchParams.get('email') || ''
  const email = emailRaw.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    return NextResponse.json({ exists: !!user, hasPassword: !!user?.passwordHash })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
