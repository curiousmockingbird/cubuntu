import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import prisma from '../../../lib/prisma'
import { getPusherServer } from '../../../lib/pusher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const comments = await prisma.comment.findMany({
    where: { episodeSlug: slug },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { slug?: string; content?: string; parentId?: string | null } | null
  if (!body?.slug || !body?.content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const content = body.content.trim()
  if (content.length === 0 || content.length > 2000) return NextResponse.json({ error: 'Invalid content' }, { status: 400 })

  // If replying, ensure parent exists and belongs to same episode
  if (body.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: body.parentId } })
    if (!parent || parent.episodeSlug !== body.slug) {
      return NextResponse.json({ error: 'Invalid parent' }, { status: 400 })
    }
  }

  const created = await prisma.comment.create({
    data: {
      episodeSlug: body.slug,
      content,
      user: { connect: { id: session.user.id } },
      // Use relation connect instead of FK field to be compatible with Checked input
      ...(body.parentId ? { parent: { connect: { id: body.parentId } } } : {}),
    },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
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
