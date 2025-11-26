import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'
import SignOutButton from './SignOutButton'

export default async function SiteHeader() {
  const session = await getServerSession(authOptions)
  const user = session?.user
  return (
    <header className="mb-6">
      <h1 className="mb-1 text-2xl font-semibold">
        <Link href="/" className="text-blue-600 hover:underline">
          Podcast MVP
        </Link>
      </h1>
      <p className="muted">A minimal podcast website built with Next.js</p>
      <nav className="mt-2 flex flex-wrap items-center gap-4" aria-label="Primary">
        <Link className="text-blue-600 hover:underline" href="/about">About</Link>
        <Link className="text-blue-600 hover:underline" href="/social">Social Media</Link>
        <Link className="text-blue-600 hover:underline" href="/donate">Donate</Link>
        <span className="flex-1" />
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            {/* User avatar (image or initial) */}
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={(user.name || user.email || 'User') as string}
                className="h-8 w-8 rounded-full object-cover border"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium">
                {((user.name || user.email || 'U') as string).charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-slate-600">Hi, {user.name || user.email}</span>
            <SignOutButton />
          </div>
        ) : (
          <>
            <Link className="text-blue-600 hover:underline" href="/login">Sign in</Link>
            <Link className="text-blue-600 hover:underline" href="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  )
}
