import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <h1>
        <Link href="/" className="link" style={{ textDecoration: 'none' }}>
          Podcast MVP
        </Link>
      </h1>
      <p>A minimal podcast website built with Next.js</p>
      <nav className="site-nav" aria-label="Primary">
        <Link className="link" href="/about">About</Link>
        {' · '}
        <Link className="link" href="/social">Social Media</Link>
        {' · '}
        <Link className="link" href="/donate">Donate</Link>
      </nav>
    </header>
  );
}
