import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from '../../components/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginPage() {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">Sign in</h2>
      <LoginForm />
      <p className="mt-4 text-sm">
        No account? <Link className="text-blue-600 hover:underline" href="/register">Create one</Link>
      </p>
    </section>
  )
}

