import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="mb-6">
      <h1 className="mb-1 text-2xl font-semibold">
        <Link href="/" className="text-blue-600 hover:underline">
          Podcast MVP
        </Link>
      </h1>
      <p className="muted">A minimal podcast website built with Next.js</p>
      <nav className="mt-2 flex gap-4" aria-label="Primary">
        <Link className="text-blue-600 hover:underline" href="/about">About</Link>
        <Link className="text-blue-600 hover:underline" href="/social">Social Media</Link>
        <Link className="text-blue-600 hover:underline" href="/donate">Donate</Link>
      </nav>
    </header>
  );
}
