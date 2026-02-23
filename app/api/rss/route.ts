import { NextResponse } from 'next/server';
import { getAllEpisodes } from '../../../lib/episodes';

export const revalidate = 3600;

export async function GET() {
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const episodes = await getAllEpisodes();
  const feed = buildRss({ site, episodes });
  return new NextResponse(feed, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluteUrl(site: string, url: string): string {
  try {
    return new URL(url, site).toString();
  } catch {
    return url;
  }
}

// Remove lightweight inline formatting markers from description text
function stripFormatting(s: string): string {
  if (!s) return s;
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
}

function buildRss({ site, episodes }: { site: string; episodes: Awaited<ReturnType<typeof getAllEpisodes>> }) {
  const items = episodes
    .map(
      (e) => `
      <item>
        <title>${esc(stripFormatting(e.title))}</title>
        <link>${site}/episodes/${e.slug}</link>
        <guid>${site}/episodes/${e.slug}</guid>
        <description>${esc(stripFormatting(e.description))}</description>
        <pubDate>${new Date(e.date).toUTCString()}</pubDate>
        <enclosure url="${esc(absoluteUrl(site, e.audioUrl))}" type="audio/mpeg" />
      </item>
    `,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Podcast MVP</title>
    <link>${site}</link>
    <description>A simple podcast site with in-browser audio playback.</description>
    ${items}
  </channel>
</rss>`;
}
