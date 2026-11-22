import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SalonFlow } from '@/components/salon/SalonFlow';
import { getBarbershops, getShopAreas } from '@/services/barbershopsService';

export const metadata: Metadata = {
  title: 'Cortar no salão',
  description:
    'Escolha a barbearia mais perto de si em Luanda, o corte e a hora. Sem fila de espera.',
  alternates: { canonical: '/salao' },
  openGraph: {
    title: 'Cortar no salão · Korte',
    description: 'Escolha a barbearia mais perto de si, o corte e a hora.',
    url: '/salao',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Korte.' }],
  },
};

/**
 * Jornada do salão.
 *
 * Server Component fino, como `/agendar`: carrega as barbearias e as zonas no
 * build e entrega-as à jornada, que é cliente. A página sai estática — o
 * `?barbearia=` é lido no navegador.
 */
export default async function SalonPage() {
  const [{ results: shops }, areas] = await Promise.all([
    getBarbershops(),
    getShopAreas(),
  ]);

  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="sr-only">Agendar um corte no salão</h1>

        <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
          <SalonFlow shops={shops} areas={areas} />
        </Suspense>
      </div>
    </div>
  );
}
