import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'
import PrimaryNav, { type SimpleUser } from './PrimaryNav'

export default async function SiteHeader() {
  const session = await getServerSession(authOptions)
  const user = (session?.user ?? null) as SimpleUser
  return (
    <header className="mb-6 bg-red-50">
      <section className='flex flex-col items-center'>
      <h1 className="mb-1 text-2xl font-semibold">
        <Link href="/" className="text-blue-600 hover:underline">
          Podcast MVP
        </Link>
      </h1>
      <p className="muted">A minimal podcast website built with Next.js</p>
      </section>
      <PrimaryNav user={user} />
    </header>
  )
}
