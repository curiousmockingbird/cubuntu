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
    </header>
  );
}

