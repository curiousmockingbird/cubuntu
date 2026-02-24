import './globals.css';
import 'react-h5-audio-player/lib/styles.css';
import type { Metadata } from 'next';
import SiteHeader from '../components/SiteHeader';
import Providers from './providers';
import SiteFooter from '../components/SiteFooter';
import { Analytics } from '@vercel/analytics/next';

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
        <Providers>
          <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-2 pb-12 ">
            <SiteHeader />
            <main className="flex-1 flex flex-col">
              {children}
              <Analytics />
              </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
