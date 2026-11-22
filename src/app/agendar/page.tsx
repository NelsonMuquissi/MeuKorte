import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { getBarbers } from '@/services/barbersService';

export const metadata: Metadata = {
  title: 'Agendar agora',
  description:
    'Agende o seu corte em Luanda: escolha o serviço, o estilo, o barbeiro e a hora. No local da sua preferência.',
  alternates: { canonical: '/agendar' },
  openGraph: {
    title: 'Agendar agora · Korte',
    description: 'Escolha o serviço, o estilo, o barbeiro e a hora.',
    url: '/agendar',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Korte.' }],
  },
};

/**
 * Página de agendamento.
 *
 * Server Component fino: carrega os barbeiros no build e entrega-os ao fluxo,
 * que é cliente. A página continua estática — o `?barbeiro=` é lido no cliente,
 * dentro do `BookingFlow`.
 *
 * Superfície clara, como o resto do site. O cabeçalho dos fluxos é escuro:
 * trata disso sozinho, forçando o seu próprio `data-surface`.
 */
export default async function BookingPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="sr-only">Agendar um corte</h1>

        <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
          <BookingFlow barbers={barbers} />
        </Suspense>
      </div>
    </div>
  );
}
