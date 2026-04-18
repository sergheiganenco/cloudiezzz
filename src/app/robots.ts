import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://cloudiezzz.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/order/', '/gift/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
