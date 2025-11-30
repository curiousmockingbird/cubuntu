"use client"

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSent(null)
    const v = email.toLowerCase().trim()
    if (!v) return setError('Enter your email')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: v }) })
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error((j as any).error || 'Could not send reset email')
      setSent('If an account exists for this email, a reset link has been sent.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-md">
      <h2 className="mb-4 text-2xl font-semibold">Reset your password</h2>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input id="email" type="email" className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {sent && <p className="text-sm text-green-700 whitespace-pre-wrap break-all">{sent}</p>}
        <button disabled={loading} className="w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white disabled:opacity-60" type="submit">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </section>
  )
}
