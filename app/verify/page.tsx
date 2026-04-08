"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'

export default function VerifySignupPage() {
  const search = useSearchParams()
  const router = useRouter()
  const token = search.get('token') || ''
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState<string>('Verifying…')

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Missing token')
        return
      }
      try {
        const res = await fetch('/api/auth/register-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
        const j = await res.json().catch(() => ({} as any))
        if (!res.ok) {
          setStatus('error')
          setMessage(j.error || 'Verification failed')
        } else {
          setStatus('ok')
          setMessage('Email verified! Signing you in…')
          const t = (j as any).loginToken as string | undefined
          if (t) {
            // Auto sign-in using one-time token
            await signIn('credentials', { loginToken: t, callbackUrl: '/' })
          }
        }
      } catch (err) {
        setStatus('error')
        setMessage((err as Error).message)
      }
    }
    run()
  }, [token])

  return (
    <section className="max-w-md">
      <h2 className="mb-4 text-2xl font-semibold">Confirming your email</h2>
      <p className={status === 'error' ? 'text-red-600' : 'text-slate-700'}>{message}</p>
      {status === 'ok' && (
        <div className="mt-4">
          <button onClick={() => router.push('/auth')} className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-white">Inicia sesión</button>
        </div>
      )}
    </section>
  )
}
