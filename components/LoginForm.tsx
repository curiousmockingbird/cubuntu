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
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
      <div>
        <label className="block text-sm mb-1" htmlFor="email">Email</label>
        <input id="email" className="w-full rounded border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="password">Password</label>
        <input id="password" className="w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white" type="submit">Sign in</button>
    </form>
  )
}

