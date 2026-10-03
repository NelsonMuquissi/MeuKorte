import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BarberList } from '@/components/barbers/BarberList';
import { getBarbers } from '@/services/barbersService';
import { allSpecialties } from '@/data/barbers';

export const metadata: Metadata = {
  title: 'Barbeiros',
  description:
    'Conhece os barbeiros do Meu Korte em Luanda. Vê especialidades, preços e avaliações, e marca com quem quiseres.',
  alternates: { canonical: '/barbeiros' },
  openGraph: {
    title: 'Barbeiros · Meu Korte',
    description: 'Escolhe o barbeiro que quiseres e marca à hora que te der jeito.',
    url: '/barbeiros',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Meu Korte' }],
  },
};

/**
 * Lista de barbeiros.
 *
 * Server Component: vai buscar os barbeiros ao serviço no momento do build e
 * entrega-os já prontos ao `BarberList`, que trata dos filtros no cliente.
 * Assim a página fica estática e o HTML gerado traz a lista completa.
 */
export default async function BarbersPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header>
        <h1 className="text-4xl sm:text-5xl">Barbeiros</h1>
        <p className="mt-3 max-w-lg text-text-muted">
          Vê o trabalho de cada um, os preços e as avaliações. Marca com quem quiseres.
        </p>
      </header>

      {/* `useSearchParams` dentro do BarberList obriga a um limite de Suspense
          para a página poder continuar a ser pré-renderizada. */}
      <Suspense fallback={<div className="mt-8 h-96" />}>
        <BarberList barbers={barbers} specialties={allSpecialties} />
      </Suspense>
    </div>
  );
}
