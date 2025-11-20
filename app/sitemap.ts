import type { MetadataRoute } from 'next';
import { episodes } from '../data/episodes';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const items: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    ...episodes.map((e) => ({ url: `${base}/episodes/${e.slug}`, lastModified: new Date(e.date) })),
  ];
  return items;
}

