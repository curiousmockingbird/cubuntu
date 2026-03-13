import './globals.css';
import 'react-h5-audio-player/lib/styles.css';
import type { Metadata } from 'next';
import SiteHeader from '../components/SiteHeader';
import Providers from './providers';
import GlobalAudioProvider from '../components/GlobalAudioProvider';
import SiteFooter from '../components/SiteFooter';
import { Analytics } from '@vercel/analytics/next';

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Cubuntu',
    template: '%s • Cubuntu',
  },
  // Referenciado de los show notes del episodio de introducción
  description:
    'Si quieres reír, pensar, recordar, cuestionarte o simplemente sentirte acompañado, dale play y únete a esta tertulia entre socios separados por kilómetros, pero unidos por la misma raíz.',
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Cubuntu',
    description:
      'Si quieres reír, pensar, recordar, cuestionarte o simplemente sentirte acompañado, dale play y únete a esta tertulia entre socios separados por kilómetros, pero unidos por la misma raíz.',
    images: [
      'https://res.cloudinary.com/graphicdesignportfolio/image/upload/v1765391819/samples/cubuntu/preparate_tcivrb.png',
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cubuntu',
    description:
      'Si quieres reír, pensar, recordar, cuestionarte o simplemente sentirte acompañado, dale play y únete a esta tertulia entre socios separados por kilómetros, pero unidos por la misma raíz.',
    images: [
      'https://res.cloudinary.com/graphicdesignportfolio/image/upload/v1765391819/samples/cubuntu/preparate_tcivrb.png',
    ],
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
          <GlobalAudioProvider>
            <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-2 pb-24 ">
              <SiteHeader />
              <main className="flex-1 flex flex-col">
                {children}
                <Analytics />
                </main>
              <SiteFooter />
            </div>
          </GlobalAudioProvider>
        </Providers>
      </body>
    </html>
  );
}
