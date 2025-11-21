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

function buildRss({ site, episodes }: { site: string; episodes: Awaited<ReturnType<typeof getAllEpisodes>> }) {
  const items = episodes
    .map(
      (e) => `
      <item>
        <title>${esc(e.title)}</title>
        <link>${site}/episodes/${e.slug}</link>
        <guid>${site}/episodes/${e.slug}</guid>
        <description>${esc(e.description)}</description>
        <pubDate>${new Date(e.date).toUTCString()}</pubDate>
        <enclosure url="${esc(e.audioUrl)}" type="audio/mpeg" />
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
