"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const search = useSearchParams()
  const router = useRouter()
  const token = search.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setError(null)
  }, [password, confirm])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) return setError('Missing token')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error((j as any).error || 'Failed to reset password')
      setOk(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-md">
      <h2 className="mb-4 text-2xl font-semibold">Set a new password</h2>
      {!ok ? (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="password">New password</label>
            <input id="password" type="password" className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" className="w-full rounded border px-3 py-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white disabled:opacity-60" type="submit">
            {loading ? 'Saving…' : 'Save password'}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-green-700">Your password has been reset. You can now sign in.</p>
          <button onClick={() => router.push('/auth')} className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white">Go to sign in</button>
        </div>
      )}
    </section>
  )
}