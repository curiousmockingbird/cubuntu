import './globals.css';
import type { Metadata } from 'next';

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Podcast MVP',
    template: '%s • Podcast MVP',
  },
  description: 'A simple podcast site with in-browser audio playback.',
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Podcast MVP',
    description: 'A simple podcast site with in-browser audio playback.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podcast MVP',
    description: 'A simple podcast site with in-browser audio playback.',
  },
  alternates: {
    types: {
      'application/rss+xml': '/api/rss',
    },
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="site-header">
            <h1>Podcast MVP</h1>
            <p>A minimal podcast website built with Next.js</p>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <small>© {new Date().getFullYear()} Podcast MVP</small>
          </footer>
        </div>
      </body>
    </html>
  );
}

