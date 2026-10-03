import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { getBarbers } from '@/services/barbersService';

export const metadata: Metadata = {
  title: 'Marcar corte',
  description:
    'Marca o teu corte em Luanda: escolhe o barbeiro, o serviço e a hora. No salão ou em tua casa. Leva menos de um minuto.',
  alternates: { canonical: '/marcar' },
  openGraph: {
    title: 'Marcar corte · Meu Korte',
    description: 'Escolhe o barbeiro, o serviço e a hora. Leva menos de um minuto.',
    url: '/marcar',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Meu Korte' }],
  },
};

/**
 * Página de marcação.
 *
 * Server Component fino: carrega os barbeiros no build e entrega-os ao fluxo,
 * que é cliente. A página continua estática — o `?barbeiro=` é lido no cliente,
 * dentro do `BookingFlow`.
 */
export default async function BookingPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl">Marcar corte</h1>
        <p className="mt-3 max-w-lg text-text-muted">
          Quatro passos e está feito. Não pagas nada para marcar.
        </p>
      </header>

      <Suspense fallback={<div className="h-96" />}>
        <BookingFlow barbers={barbers} />
      </Suspense>
    </div>
  );
}
