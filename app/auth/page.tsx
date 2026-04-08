import type { Metadata } from 'next'
import AuthIntake from '../../components/AuthIntake'

export const metadata: Metadata = {
  title: 'Sign in or Create account',
}

export default function AuthPage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center ">
      <h2 className="mb-4 text-2xl font-semibold">Bienvenidos</h2>
      <AuthIntake />
    </section>
  )
}
