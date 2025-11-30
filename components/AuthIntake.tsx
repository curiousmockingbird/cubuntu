"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

type Stage = 'email' | 'password' | 'register'

export default function AuthIntake() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [stage])

  const onContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const v = email.toLowerCase().trim()
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError('Enter a valid email')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/users/exists?email=${encodeURIComponent(v)}`)
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Could not continue')
      setEmail(v)
      if (!j.exists) {
        setStage('register')
      } else if (j.hasPassword) {
        setStage('password')
      } else {
        setError('This email is linked to Google. Use Continue with Google below.')
        setStage('email')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md space-y-5">
      {stage === 'email' && (
        <form onSubmit={onContinue} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input id="email" type="email" className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
            {loading ? 'Checking…' : 'Continue'}
          </button>
        </form>
      )}

      {stage === 'password' && (
        <PasswordStage email={email} onBack={() => setStage('email')} />
      )}

      {stage === 'register' && (
        <RegisterStage email={email} onBack={() => setStage('email')} />
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500">OR</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="w-full rounded-md border px-4 py-2 bg-white hover:bg-gray-50"
      >
        Continue with Google
      </button>
    </div>
  )
}

function PasswordStage({ email, onBack }: { email: string; onBack: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn('credentials', { redirect: false, email, password })
    setLoading(false)
    if (res?.ok) {
      window.location.href = '/'
    } else {
      setError('Invalid password')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Email</label>
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-700">{email}</div>
          <button type="button" onClick={onBack} className="text-xs text-blue-600 hover:underline">Change</button>
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="password">Password</label>
        <input id="password" type="password" className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <div className="text-right">
        <a href={`/forgot`} className="text-xs text-blue-600 hover:underline">Forgot password?</a>
      </div>
    </form>
  )
}

function RegisterStage({ email, onBack }: { email: string; onBack: () => void }) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const nm = name.trim()
      const un = username.trim()
      if (!nm) throw new Error('Name is required')
      if (nm.length < 2 || nm.length > 50) throw new Error('Name must be 2–50 characters')
      if (un && (un.length < 3 || un.length > 32)) throw new Error('Username must be 3–32 characters')
      if (un) {
        const r = await fetch(`/api/users/exists?username=${encodeURIComponent(un)}`)
        const j = await r.json().catch(() => ({} as any))
        if (r.ok && j.exists) throw new Error('Username already taken')
      }
      const res = await fetch('/api/auth/register-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nm, username: un || undefined, email, password }),
      })
      const j = await res.json().catch(() => ({} as any))
      if (!res.ok) throw new Error((j as any).error || 'Failed to start sign up')
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-600 text-white text-lg">✉️</div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Check your email to verify</h3>
            <p className="mt-1 text-sm text-slate-700">
              We sent a verification link to <br/>
              <span className="ml-1 font-medium">{email}</span>.
              Click the link to finish creating your account.
            </p>
            <ul className="mt-3 text-sm text-slate-700 list-disc pl-5 space-y-1">
              <li>Open your inbox and look for our message.</li>
              <li>Check spam or promotions if you don’t see it.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {/* <a href="https://mail.google.com/" target="_blank" className="rounded-md border px-3 py-2 bg-white hover:bg-gray-50 text-sm">Open Gmail</a>
              <a href="https://outlook.live.com/" target="_blank" className="rounded-md border px-3 py-2 bg-white hover:bg-gray-50 text-sm">Open Outlook</a> */}
              <button onClick={onBack} className=" text-sm text-blue-600 hover:underline">Use a different email</button>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="text-xs text-slate-500">Didn’t get it? It can take a minute. You can also try again.</div>
        <div>
          <button onClick={(e) => submit(e as any)} disabled={loading} className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white disabled:opacity-60 text-sm">
            {loading ? 'Resending…' : 'Resend verification email'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Email</label>
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-700">{email}</div>
          <button type="button" onClick={onBack} className="text-xs text-blue-600 hover:underline">Change</button>
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="name">Name</label>
        <input id="name" required minLength={2} maxLength={50} className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        <p className="text-xs text-slate-500 mt-1">2–50 characters</p>
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="username">Username (optional)</label>
        <input id="username" minLength={3} maxLength={32} className="w-full rounded border px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        <p className="text-xs text-slate-500 mt-1">3–32 characters</p>
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="password">Password</label>
        <input id="password" type="password" required className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-slate-500 mt-1">8+ characters recommended</p>
      </div>
      {error && <p className="text-sm text-slate-700">{error}</p>}
      <button disabled={loading} className="w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white disabled:opacity-60" type="submit">
        {loading ? 'Sending…' : 'Create account'}
      </button>
    </form>
  )
}
