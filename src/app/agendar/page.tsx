import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { getBarbers } from '@/services/barbersService';

export const metadata: Metadata = {
  title: 'Agendar agora',
  description:
    'Marca o teu corte em Luanda: escolhe o serviço, o estilo, o barbeiro e a hora. No salão ou em tua casa.',
  alternates: { canonical: '/agendar' },
  openGraph: {
    title: 'Agendar agora · Meu Korte',
    description: 'Escolhe o serviço, o estilo, o barbeiro e a hora.',
    url: '/agendar',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Meu Korte' }],
  },
};

/**
 * Página de agendamento.
 *
 * Server Component fino: carrega os barbeiros no build e entrega-os ao fluxo,
 * que é cliente. A página continua estática — o `?barbeiro=` é lido no cliente,
 * dentro do `BookingFlow`.
 *
 * Superfície CLARA, como todo o fluxo no template. O cabeçalho mantém-se escuro
 * por cima dela: trata disso sozinho, forçando o seu próprio `data-surface`.
 */
export default async function BookingPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div data-surface="light" className="min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="sr-only">Agendar um corte</h1>

        <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
          <BookingFlow barbers={barbers} />
        </Suspense>
      </div>
    </div>
  );
}
