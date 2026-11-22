import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * Fontes servidas pelo próprio domínio, através do next/font: não há pedido ao
 * Google em tempo de execução e não há salto de texto ao carregar.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

/**
 * O domínio é preciso para que as imagens de Open Graph tenham URL absoluto.
 * O Vercel define `VERCEL_URL` automaticamente em cada deploy.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://meukorte.ao');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Korte — o seu barbeiro, onde estiver',
    // As páginas definem só o seu nome; o resto vem daqui.
    template: '%s · Korte',
  },
  description:
    'Agende o seu corte com o barbeiro que preferir, à hora que lhe convier. No salão ou no local da sua preferência, sem filas de espera.',
  applicationName: 'Korte',
  keywords: ['barbearia', 'barbeiro', 'corte de cabelo', 'Luanda', 'Angola', 'agendamento'],
  authors: [{ name: 'Korte' }],
  openGraph: {
    type: 'website',
    locale: 'pt_AO',
    siteName: 'Korte',
    title: 'Korte — o seu barbeiro, onde estiver',
    description:
      'Escolha o barbeiro, escolha a hora, evite a fila. No salão ou no local da sua preferência.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Korte — o seu barbeiro, onde estiver',
    description:
      'Escolha o barbeiro, escolha a hora, evite a fila. No salão ou no local da sua preferência.',
  },
};

export const viewport: Viewport = {
  // Acompanha o fundo do cabeçalho na barra do navegador no telemóvel.
  themeColor: '#F7F5F2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-AO" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {/* Primeiro alvo do Tab: deixa saltar a navegação toda. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-ink"
        >
          Saltar para o conteúdo
        </a>

        <ToastProvider>
          <Header />
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </ToastProvider>
      </body>
    </html>
  );
}
