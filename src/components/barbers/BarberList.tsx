'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Barber, LocationType } from '@/types';
import { BarberCard } from './BarberCard';
import { BarberFilters } from './BarberFilters';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Lista de barbeiros com filtros.
 *
 * A filtragem é feita aqui, no cliente, e não no servidor. A razão é de
 * desempenho: ler `searchParams` num Server Component obriga a página a ser
 * gerada a cada pedido, e `/barbeiros` deixaria de ser estática.
 *
 * Como são quatro barbeiros, filtrar um array de quatro posições no navegador
 * não custa nada, e a página continua a ser servida já pronta pela CDN. O HTML
 * gerado no build traz a lista completa, que é o que os motores de busca vêem.
 *
 * Se um dia forem centenas de barbeiros, isto passa a `GET /api/barbers/?...`
 * com filtragem no Django, e a página volta a ser dinâmica — por isso a lógica
 * dos filtros está no `barbersService`, não aqui.
 */
export function BarberList({
  barbers,
  specialties,
}: {
  barbers: Barber[];
  specialties: string[];
}) {
  const searchParams = useSearchParams();

  const filtered = useMemo(() => {
    const atendimento = searchParams.get('atendimento');
    const especialidade = searchParams.get('especialidade');

    // Valores desconhecidos na URL são ignorados, para que um link estragado
    // mostre a lista toda em vez de uma lista vazia.
    const locationType: LocationType | undefined =
      atendimento === 'salao' || atendimento === 'domicilio' ? atendimento : undefined;
    const specialty =
      especialidade && specialties.includes(especialidade) ? especialidade : undefined;

    return barbers.filter(
      (barber) =>
        (!locationType || barber.locationTypes.includes(locationType)) &&
        (!specialty || barber.specialties.includes(specialty)),
    );
  }, [barbers, specialties, searchParams]);

  return (
    <>
      <div className="mt-8 border-y border-border py-6">
        <BarberFilters specialties={specialties} resultCount={filtered.length} />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-text">Nenhum barbeiro com esses filtros.</p>
          <p className="mt-2 text-text-muted">
            Estamos a começar com quatro profissionais. Experimenta tirar um filtro.
          </p>
          <ButtonLink href="/barbeiros" variant="secondary" className="mt-6">
            Ver todos os barbeiros
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((barber, index) => (
            <BarberCard key={barber.id} barber={barber} priority={index < 2} />
          ))}
        </div>
      )}
    </>
  );
}
