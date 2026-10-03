import type { MetadataRoute } from 'next';
import { barbers } from '@/data/barbers';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://meukorte.ao');

/**
 * Mapa do site.
 *
 * Só entram as páginas públicas. `/minhas-marcacoes` é pessoal e os painéis são
 * demonstrações — nenhum deles tem razão para aparecer numa pesquisa.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/barbeiros`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/marcar`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    ...barbers.map((barber) => ({
      url: `${siteUrl}/barbeiros/${barber.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
