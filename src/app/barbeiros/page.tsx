import type { Metadata } from 'next';
import { BarberCard } from '@/components/barbers/BarberCard';
import { getBarbers } from '@/services/barbersService';
import { PILOT_AREA } from '@/config/business';

export const metadata: Metadata = {
  title: 'Barbeiros',
  description:
    'Conheça os barbeiros da Korte em Luanda. Veja as avaliações, a zona e o preço, e agende com quem preferir.',
  alternates: { canonical: '/barbeiros' },
  openGraph: {
    title: 'Barbeiros · Korte',
    description: 'Escolha o barbeiro que preferir e agende à hora que lhe convier.',
    url: '/barbeiros',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Korte.' }],
  },
};

/**
 * Lista de barbeiros — o mesmo desenho da secção "Os nossos barbeiros" da
 * página inicial (`Meet Talatona's Best Barbers.png`).
 *
 * Sem filtros: o cliente riscou a versão anterior, com filtros de atendimento
 * e especialidade. Com quatro barbeiros, os cards dizem tudo de uma vez.
 *
 * Server Component, estática.
 */
export default async function BarbersPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header>
        <h1 className="text-4xl sm:text-5xl">
          Os nossos <span className="text-accent">barbeiros</span>
        </h1>
        <p className="mt-3 max-w-lg text-lg text-text-muted">
          Profissionais escolhidos a dedo para o arranque em {PILOT_AREA.district}.
          Veja as avaliações e agende com quem preferir.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {barbers.map((barber, index) => (
          <BarberCard key={barber.id} barber={barber} priority={index < 2} />
        ))}
      </div>
    </div>
  );
}
