'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { LocationType } from '@/types';

/**
 * Filtros da lista de barbeiros.
 *
 * O estado vive na URL, não no componente. Assim o filtro sobrevive ao recarregar
 * da página, funciona com os botões de avançar e recuar do navegador, e o cliente
 * pode partilhar o link já filtrado — "olha os que vão a casa".
 *
 * `scroll: false` evita o salto para o topo a cada clique, que no telemóvel é
 * especialmente irritante porque os filtros ficam acima da lista.
 */

interface BarberFiltersProps {
  specialties: string[];
  /** Quantos barbeiros é que o filtro actual devolveu. */
  resultCount: number;
}

const LOCATION_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'salao', label: 'No salão' },
  { value: 'domicilio', label: 'Ao domicílio' },
];

export function BarberFilters({ specialties, resultCount }: BarberFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = {
    atendimento: searchParams.get('atendimento'),
    especialidade: searchParams.get('especialidade'),
  };

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) params.delete(key);
      else params.set(key, value);

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const hasFilters = current.atendimento !== null || current.especialidade !== null;

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-text">Atendimento</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip
            active={current.atendimento === null}
            onClick={() => setFilter('atendimento', null)}
          >
            Todos
          </FilterChip>
          {LOCATION_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={current.atendimento === option.value}
              onClick={() => setFilter('atendimento', option.value)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-text">Especialidade</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip
            active={current.especialidade === null}
            onClick={() => setFilter('especialidade', null)}
          >
            Todas
          </FilterChip>
          {specialties.map((specialty) => (
            <FilterChip
              key={specialty}
              active={current.especialidade === specialty}
              onClick={() => setFilter('especialidade', specialty)}
            >
              {specialty}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        {/* Anuncia a contagem a quem usa leitor de ecrã, já que a lista muda
            sem recarregar a página. */}
        <p aria-live="polite" className="text-sm text-text-muted">
          {resultCount === 0
            ? 'Nenhum barbeiro corresponde'
            : resultCount === 1
              ? '1 barbeiro'
              : `${resultCount} barbeiros`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname, { scroll: false })}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[40px] rounded-full border px-4 text-sm font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-ink'
          : 'border-border bg-surface text-text-muted hover:border-primary-dim hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}
