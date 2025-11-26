"use client"

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })
    if (res?.ok) {
      window.location.href = '/'
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="space-y-4 max-w-sm">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input id="email" className="w-full rounded border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password">Password</label>
          <input id="password" className="w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white" type="submit">Sign in</button>
      </form>

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
