"use client"

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Pusher from 'pusher-js'

type Comment = {
  id: string
  content: string
  createdAt: string
  user: { id: string; name?: string | null; email?: string | null; image?: string | null }
  parentId?: string | null
}

type CommentNode = Comment & { children: CommentNode[] }

// Maximum depth to render replies inline. Deeper levels are collapsed.
const MAX_INLINE_DEPTH = 2

const buildTree = (list: Comment[]): CommentNode[] => {
  const byId = new Map<string, CommentNode>()
  const roots: CommentNode[] = []
  list
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((c) => {
      byId.set(c.id, { ...c, children: [] })
    })
  byId.forEach((node) => {
    if (node.parentId) {
      const parent = byId.get(node.parentId)
      if (parent) parent.children.push(node)
      else roots.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

type CommentItemProps = {
  node: CommentNode
  depth: number
  canReply: boolean
  isExpandedById: (id: string) => boolean
  onToggleExpand: (id: string) => void
  onToggleReply: (id: string) => void
  isReplyOpen: (id: string) => boolean
  getReplyValue: (id: string) => string
  onReplyChange: (id: string, v: string) => void
  onSubmitReply: (id: string) => void
}

function CommentItem({
  node,
  depth,
  canReply,
  isExpandedById,
  onToggleExpand,
  onToggleReply,
  isReplyOpen,
  getReplyValue,
  onReplyChange,
  onSubmitReply,
}: CommentItemProps) {
  const displayName = node.user.name || node.user.email || 'User'
  const initial = (displayName || 'U').charAt(0).toUpperCase()
  const indent = Math.min(depth, 6)
  const showChildrenInline = depth < MAX_INLINE_DEPTH
  const isExpanded = isExpandedById(node.id)
  const hasHiddenChildren = !showChildrenInline && node.children.length > 0
  const allowReplyHere = canReply && depth < MAX_INLINE_DEPTH

  return (
    <li className="rounded border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3" style={{ marginLeft: indent * 16 }}>
        {node.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.user.image} alt={displayName} className="h-8 w-8 rounded-full object-cover border" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium">
            {initial}
          </div>
        )}
        <div className="flex-1">
          <div className="text-sm text-slate-600">
            <strong>{displayName}</strong>
            <span className="ml-2">{new Date(node.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap">{node.content}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
            {allowReplyHere && (
              <button type="button" onClick={() => onToggleReply(node.id)} className="hover:underline text-blue-600">
                Responder
              </button>
            )}
            {hasHiddenChildren && (
              <button type="button" onClick={() => onToggleExpand(node.id)} className="hover:underline">
                {isExpanded ? 'Ocultar respuestas' : `Mostrar ${node.children.length} respuestas`}
              </button>
            )}
          </div>

          {isReplyOpen(node.id) && allowReplyHere && (
            <div className="mt-2">
              <textarea
                className="w-full rounded border px-3 py-2"
                rows={2}
                value={getReplyValue(node.id)}
                onChange={(e) => onReplyChange(node.id, e.target.value)}
                placeholder={`Responder a ${displayName}`}
              />
              <div className="mt-1 flex gap-2">
                <button
                  className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1 text-white"
                  type="button"
                  onClick={() => onSubmitReply(node.id)}
                >
                  Publicar
                </button>
                <button className="text-slate-600" type="button" onClick={() => onToggleReply(node.id)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {node.children.length > 0 && (showChildrenInline || isExpanded) && (
            <ul className="mt-3 space-y-3">
              {node.children.map((child) => (
                <CommentItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  canReply={canReply}
                  isExpandedById={isExpandedById}
                  onToggleExpand={onToggleExpand}
                  onToggleReply={onToggleReply}
                  isReplyOpen={isReplyOpen}
                  getReplyValue={getReplyValue}
                  onReplyChange={onReplyChange}
                  onSubmitReply={onSubmitReply}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  )
}

export default function Comments({ slug }: { slug: string }) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: items = [], isLoading, isFetching } = useQuery({
    queryKey: ['comments', slug],
    queryFn: async () => {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load comments')
      const data = (await res.json()) as { comments: Comment[] }
      return data.comments
    },
  })

  // Live updates via Pusher
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return

    const pusher = new Pusher(key, { cluster })
    const channelName = `comments-${slug}`
    const channel = pusher.subscribe(channelName)

    const handler = (c: Comment) => {
      qc.setQueryData<Comment[]>(['comments', slug], (old = []) => {
        if (old.some((x) => x.id === c.id)) return old
        return [c, ...old]
      })
    }

    channel.bind('new-comment', handler)

    return () => {
      channel.unbind('new-comment', handler)
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [slug, qc])

  const addComment = useMutation({
    mutationFn: async (payload: { slug: string; content: string; parentId?: string | null }) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((j as any).error || 'Failed to post comment')
      return j.comment as Comment
    },
    onMutate: async (newComment) => {
      setError(null)
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await qc.cancelQueries({ queryKey: ['comments', slug] })
      const prev = qc.getQueryData<Comment[]>(['comments', slug])
      const temp: Comment = {
        id: `temp-${Date.now()}`,
        content: newComment.content,
        createdAt: new Date().toISOString(),
        user: { id: session?.user?.id || 'me', name: session?.user?.name || null, email: session?.user?.email || null, image: (session as any)?.user?.image || null },
        parentId: newComment.parentId || null,
      }
      qc.setQueryData<Comment[]>(['comments', slug], (old = []) => [temp, ...old])
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      setError((err as Error).message)
      qc.setQueryData(['comments', slug], ctx?.prev)
    },
    onSuccess: (saved) => {
      // Replace temp with saved or just prepend saved and filter temps
      qc.setQueryData<Comment[]>(['comments', slug], (old = []) => {
        const withoutTemps = old.filter((c) => !c.id.startsWith('temp-'))
        return [saved, ...withoutTemps]
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['comments', slug] })
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    addComment.mutate({ slug, content: text })
    setContent('')
  }

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  const toggleExpand = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }))
  const openReply = (id: string) => setReplyOpen((s) => ({ ...s, [id]: !s[id] }))

  const submitReply = (parentId: string) => {
    const text = (replyText[parentId] || '').trim()
    if (!text) return
    addComment.mutate({ slug, content: text, parentId })
    setReplyText((s) => ({ ...s, [parentId]: '' }))
    setReplyOpen((s) => ({ ...s, [parentId]: false }))
  }

  const nodes = buildTree(items)

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold">Comentarios ({items.length})</h3>
      {isLoading ? (
        <p className="text-slate-600">Cargando…</p>
      ) : nodes.length === 0 ? (
        <p className="text-slate-600">Sin comentarios aún.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {nodes.map((n) => (
            <CommentItem
              key={n.id}
              node={n}
              depth={0}
              canReply={!!session}
              isExpandedById={(id) => !!expanded[id]}
              onToggleExpand={toggleExpand}
              onToggleReply={openReply}
              isReplyOpen={(id) => !!replyOpen[id]}
              getReplyValue={(id) => replyText[id] || ''}
              onReplyChange={(id, v) => setReplyText((s) => ({ ...s, [id]: v }))}
              onSubmitReply={submitReply}
            />
          ))}
        </ul>
      )}
      {isFetching && !isLoading && <p className="mt-2 text-xs text-slate-500">Actualizando…</p>}

      <div className="mt-4">
        {session ? (
          <form onSubmit={submit} className="space-y-2 max-w-xl">
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Déjanos tu comentario…"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white" type="submit">
              Publicar
            </button>
          </form>
        ) : (
          <p className="text-slate-600 text-sm">
            <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a> para dejar comentario.
          </p>
        )}
      </div>
    </section>
  )
}
