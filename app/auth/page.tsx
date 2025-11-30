import type { Metadata } from 'next'
import AuthIntake from '../../components/AuthIntake'

export const metadata: Metadata = {
  title: 'Sign in or Create account',
}

export default function AuthPage() {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">Welcome</h2>
      <AuthIntake />
    </section>
  )
}

