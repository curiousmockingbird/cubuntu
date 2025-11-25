"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Comment = {
  id: string
  content: string
  createdAt: string
  user: { id: string; name?: string | null; email?: string | null }
}

export default function Comments({ slug }: { slug: string }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, { cache: 'no-store', credentials: 'same-origin' })
    if (res.ok) {
      const data = (await res.json()) as { comments: Comment[] }
      setItems(data.comments)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const text = content.trim()
    if (!text) return
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, content: text }),
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Failed to post comment')
      return
    }
    setContent('')
    load()
  }

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold">Comentarios</h3>
      {loading ? (
        <p className="text-slate-600">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-600">Sin comentarios aún.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded border border-slate-200 bg-white p-3">
              <div className="text-sm text-slate-600">
                <strong>{c.user.name || c.user.email || 'User'}</strong>
                <span className="ml-2">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        {session ? (
          <form onSubmit={submit} className="space-y-2 max-w-xl">
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment…"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white" type="submit">
              Déjanos tu comentario
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
