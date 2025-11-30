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
}

export default function Comments({ slug }: { slug: string }) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sortComments = (arr: Comment[]) =>
    arr.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const { data: items = [], isLoading, isFetching } = useQuery({
    queryKey: ['comments', slug],
    queryFn: async () => {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load comments')
      const data = (await res.json()) as { comments: Comment[] }
      return data.comments
    },
    select: (data) => sortComments(data),
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
        if (old.some((x) => x.id === c.id)) return old
        return sortComments([c, ...old])
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
    mutationFn: async (payload: { slug: string; content: string }) => {
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
      }
      qc.setQueryData<Comment[]>(['comments', slug], (old = []) => sortComments([temp, ...old]))
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
        // If the saved already exists (e.g., via Pusher), skip adding duplicate
        const exists = withoutTemps.some((c) => c.id === saved.id)
        const next = exists ? withoutTemps : [saved, ...withoutTemps]
        return sortComments(next)
      })
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

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold">Comentarios ({items.length})</h3>
      {isLoading ? (
        <p className="text-slate-600">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-600">Sin comentarios aún.</p>
      ) : (
        <div className="relative">
        <ul className="mt-3 space-y-3">
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
            <a href="/auth" className="text-blue-600 hover:underline">Inicia sesión</a> para dejar comentario.
          </p>
        )}
      </div>
    </section>
  )
}
