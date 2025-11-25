import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { getPusherServer } from '../../../lib/pusher'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const comments = await prisma.comment.findMany({
    where: { episodeSlug: slug },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { slug?: string; content?: string } | null
  if (!body?.slug || !body?.content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const content = body.content.trim()
  if (content.length === 0 || content.length > 2000) return NextResponse.json({ error: 'Invalid content' }, { status: 400 })

  const created = await prisma.comment.create({
    data: {
      episodeSlug: body.slug,
      userId: session.user.id,
      content,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  // Fire realtime event for clients subscribed to this episode's comments
  try {
    const pusher = getPusherServer()
    await pusher.trigger(`comments-${body.slug}`, 'new-comment', created)
  } catch (err) {
    // Best-effort: don't fail the request if push fails
    console.error('Pusher trigger failed', err)
  }
  return NextResponse.json({ comment: created }, { status: 201 })
}
