"use client"

import { useState } from 'react'
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
  replies?: Comment[]
}

export default function Comments({ slug }: { slug: string }) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const sortTopLevel = (arr: Comment[]) => arr.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const sortRepliesAsc = (arr: Comment[]) => arr.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const { data: items = [], isLoading, isFetching } = useQuery({
    queryKey: ['comments', slug],
    queryFn: async () => {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load comments')
      const data = (await res.json()) as { comments: Comment[] }
      // Ensure sort order: top-level desc, replies asc
      return sortTopLevel(
        (data.comments || []).map((c) => ({ ...c, replies: c.replies ? sortRepliesAsc(c.replies) : [] }))
      )
    },
    // Data is already sorted; keep select identity
    select: (data) => data,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
        // Reply event
        if (c.parentId) {
          const next = old.map((top) => {
            if (top.id !== c.parentId) return top
            const existing = (top.replies || [])
            if (existing.some((r) => r.id === c.id)) return top
            const replies = sortRepliesAsc([...(top.replies || []), c])
            return { ...top, replies }
          })
          // If parent not found, trigger background refetch to sync
          const parentExists = next.some((t) => t.id === c.parentId)
          if (!parentExists) {
            // fire-and-forget invalidate
            qc.invalidateQueries({ queryKey: ['comments', slug] })
            return old
          }
          return next
        }
        // Top-level event
        if (old.some((x) => x.id === c.id)) return old
        return sortTopLevel([{ ...c, replies: c.replies ? sortRepliesAsc(c.replies) : [] }, ...old])
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
        parentId: newComment.parentId ?? null,
      }
      if (newComment.parentId) {
        // Optimistically add reply to its parent
        qc.setQueryData<Comment[]>(['comments', slug], (old = []) => {
          return old.map((top) => {
            if (top.id !== newComment.parentId) return top
            const replies = sortRepliesAsc([...(top.replies || []), temp])
            return { ...top, replies }
          })
        })
      } else {
        // Optimistically add as top-level
        qc.setQueryData<Comment[]>(['comments', slug], (old = []) => sortTopLevel([{ ...temp, replies: [] }, ...old]))
      }
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      setError((err as Error).message)
      qc.setQueryData(['comments', slug], ctx?.prev)
    },
    onSuccess: (saved) => {
      // Replace temp with saved or just prepend saved and filter temps
      qc.setQueryData<Comment[]>(['comments', slug], (old = []) => {
        if (saved.parentId) {
          return old.map((top) => {
            if (top.id !== saved.parentId) return top
            const existing = top.replies || []
            const exists = existing.some((r) => r.id === saved.id)
            const replies = exists ? existing : sortRepliesAsc([...existing, saved])
            // Strip temps
            const withoutTemps = replies.filter((r) => !r.id.startsWith('temp-'))
            return { ...top, replies: withoutTemps }
          })
        }
        const withoutTempsTop = old.filter((c) => !c.id.startsWith('temp-'))
        const existsTop = withoutTempsTop.some((c) => c.id === saved.id)
        const next = existsTop ? withoutTempsTop : [{ ...saved, replies: [] }, ...withoutTempsTop]
        return sortTopLevel(next)
      })
      // Reset reply UI if we just replied
      if (saved.parentId && replyingTo === saved.parentId) {
        setReplyContent('')
        setReplyingTo(null)
      }
    },
    // Avoid immediate refetch to prevent UI bounce; background updates arrive via Pusher
    // Users can navigate or refresh to get a fresh list if needed.
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    addComment.mutate({ slug, content: text })
    setContent('')
  }

  const submitReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    const text = replyContent.trim()
    if (!text) return
    addComment.mutate({ slug, content: text, parentId })
  }

  return (
    <section className="mt-8">
      <h3
        className="text-lg font-semibold cursor-pointer select-none inline-flex items-center gap-2 hover:text-blue-700"
        role="button"
        onClick={() => setIsOpen(true)}
        title="Abrir comentarios"
      >
        Comentarios ({items.length})
      </h3>

      {/* Panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Slide-over panel */}
          <aside
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l flex flex-col"
          >
            <div className="px-4 py-3 sm:px-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Comentarios ({items.length})</h3>
              <button
                type="button"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Cerrar"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {isLoading ? (
                <p className="text-slate-600">Cargando…</p>
              ) : items.length === 0 ? (
                <p className="text-slate-600">Sin comentarios aún.</p>
              ) : (
                <div className="relative">
                <ul className="space-y-3">
          {items.map((c) => {
            const displayName = c.user.name || c.user.email || 'User'
            const initial = (displayName || 'U').charAt(0).toUpperCase()
            return (
              <li key={c.id} className="rounded border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  {c.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.user.image} alt={displayName} className="h-8 w-8 rounded-full object-cover border" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium">
                      {initial}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-slate-600">
                      <strong>{displayName}</strong>
                      <span className="ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                    <div className="mt-2 text-sm">
                      {session && (
                        <button
                          className="text-blue-600 hover:underline"
                          type="button"
                          onClick={() => setReplyingTo((prev) => (prev === c.id ? null : c.id))}
                        >
                          {replyingTo === c.id ? 'Cancelar' : 'Responder'}
                        </button>
                      )}
                    </div>

                    {replyingTo === c.id && session && (
                      <form onSubmit={(e) => submitReply(e, c.id)} className="mt-2 space-y-2">
                        <textarea
                          className="w-full rounded border px-3 py-2"
                          rows={2}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Escribe una respuesta…"
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-white" type="submit">
                          Responder
                        </button>
                      </form>
                    )}

                    {c.replies && c.replies.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {c.replies.map((r) => {
                          const rName = r.user.name || r.user.email || 'User'
                          const rInitial = (rName || 'U').charAt(0).toUpperCase()
                          return (
                            <li key={r.id} className="ml-8 rounded border border-slate-200 bg-slate-50 p-3">
                              <div className="flex items-start gap-3">
                                {r.user.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={r.user.image} alt={rName} className="h-7 w-7 rounded-full object-cover border" />
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-medium">
                                    {rInitial}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="text-xs text-slate-600">
                                    <strong>{rName}</strong>
                                    <span className="ml-2">{new Date(r.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="mt-1 whitespace-pre-wrap text-sm">{r.content}</p>
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        {isFetching && !isLoading && (
          <div className="absolute right-0 -top-6 text-xs text-slate-500">Actualizando…</div>
        )}
        </div>
              )}
            </div>

            <div className="px-4 pb-4 sm:px-6 border-t">
              {session ? (
                <form onSubmit={submit} className="space-y-2">
                  <textarea
                    className="w-full rounded border px-3 py-2"
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Déjanos tu comentario…"
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md border px-4 py-2 text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Cerrar
                    </button>
                    <button className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white" type="submit">
                      Publicar
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-slate-600 text-sm">
                  <a href="/auth" className="text-blue-600 hover:underline">Inicia sesión</a> para dejar comentario.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
