import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://cloudiezzz.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/reviews', '/contact', '/refer', '/samples'];
  const occasions = ['birthday', 'wedding', 'anniversary', 'memorial', 'graduation'];

  return [
    ...pages.map((p) => ({
      url: `${BASE}${p}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.8,
    })),
    ...occasions.map((o) => ({
      url: `${BASE}/for/${o}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
