import type { MetadataRoute } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://meukorte.ao');

/**
 * As páginas de demonstração e a página pessoal ficam fora dos motores de busca.
 * Cada uma delas tem também `robots: { index: false }` nos seus metadados — isto
 * é a segunda barreira, não a única.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/painel-barbeiro', '/minhas-marcacoes'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
