import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '../lib/episodes';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const episodes = await getAllEpisodes();
  return [
    { url: `${base}/`, lastModified: new Date() },
    ...episodes.map((e) => ({ url: `${base}/episodes/${e.slug}`, lastModified: new Date(e.date) })),
  ];
}
