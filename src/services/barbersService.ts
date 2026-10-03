/**
 * Serviço de barbeiros.
 *
 * Hoje lê de `src/data/barbers.ts`. Na fase Django, cada função passa a ser um
 * `fetch` a `/api/barbers/`, mantendo a mesma assinatura e o mesmo formato de
 * resposta. Os componentes não notam a diferença.
 */

import type { Barber, BarberFilters, PaginatedResponse } from '@/types';
import { barbers } from '@/data/barbers';

/**
 * Simula a latência da rede.
 *
 * Mantida muito baixa para não atrasar o build estático, mas suficiente para que
 * os estados de carregamento da interface sejam exercitados em desenvolvimento.
 */
function delay(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Lista os barbeiros, com filtros opcionais.
 *
 * Equivalente futuro: `GET /api/barbers/?location_type=&specialty=&area=`
 */
export async function getBarbers(
  filters: BarberFilters = {},
): Promise<PaginatedResponse<Barber>> {
  await delay();

  let results = barbers;

  if (filters.locationType) {
    results = results.filter((b) => b.locationTypes.includes(filters.locationType!));
  }
  if (filters.specialty) {
    results = results.filter((b) => b.specialties.includes(filters.specialty!));
  }
  if (filters.area) {
    results = results.filter((b) => b.area === filters.area);
  }

  return {
    count: results.length,
    next: null,
    previous: null,
    results,
  };
}

/**
 * Procura um barbeiro por `id` ou por `slug`.
 *
 * Aceita os dois porque a URL usa o slug (`/barbeiros/edson-kiala`) mas as
 * marcações guardam o `id`. Devolve `null` quando não existe — cabe a quem chama
 * decidir entre `notFound()` e uma mensagem de erro.
 *
 * Equivalente futuro: `GET /api/barbers/{id}/`
 */
export async function getBarberById(idOrSlug: string): Promise<Barber | null> {
  await delay();
  return barbers.find((b) => b.id === idOrSlug || b.slug === idOrSlug) ?? null;
}

/**
 * Barbeiros em destaque na página inicial, por ordem de avaliação.
 *
 * Equivalente futuro: `GET /api/barbers/?featured=true`
 */
export async function getFeaturedBarbers(limit = 4): Promise<Barber[]> {
  await delay();
  return [...barbers]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
}

/** O preço mais baixo do barbeiro, para o "a partir de" dos cards. */
export function getStartingPrice(barber: Barber): number {
  return Math.min(...barber.services.map((s) => s.price));
}
