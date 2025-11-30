// app/api/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name: string = String(body?.name || '').trim();
    const username: string | undefined = body?.username ? String(body.username) : undefined;
    const email: string = String(body?.email || '').toLowerCase().trim();
    const password: string = String(body?.password || '');

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Length validation
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' },
        { status: 400 },
      );
    }
    const uname = username?.trim()
    if (uname && (uname.length < 3 || uname.length > 32)) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 32 characters' },
        { status: 400 },
      );
    }

    // Uniqueness checks with specific messages
    if (uname) {
      const byUsername = await prisma.user.findUnique({ where: { username: uname } })
      if (byUsername) {
        return NextResponse.json({ error: 'Username already in use' }, { status: 409 })
      }
    }
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        username: uname || null,
        email,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
