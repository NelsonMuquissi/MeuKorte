/**
 * Serviço de barbearias.
 *
 * Equivalente futuro: `/api/barbershops/`.
 *
 * Nenhum componente lê `src/data/barbershops.ts` directamente — passa por aqui,
 * como tudo o resto, para que a troca por `fetch` toque só nesta camada.
 */

import type { Barbershop, Barber, BarbershopFilters, PaginatedResponse } from '@/types';
import { barbershops, shopAreas } from '@/data/barbershops';
import { barbers } from '@/data/barbers';

/** Imita a latência de um pedido, para a interface mostrar o que mostrará depois. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * As barbearias, com filtro por zona e por formato de atendimento.
 *
 * Equivalente futuro: `GET /api/barbershops/?area=&location_type=`
 */
export async function getBarbershops(
  filters: BarbershopFilters = {},
): Promise<PaginatedResponse<Barbershop>> {
  await tick();

  const results = barbershops.filter((shop) => {
    if (filters.area && shop.area !== filters.area) return false;
    if (filters.locationType && !shop.locationTypes.includes(filters.locationType)) return false;
    return true;
  });

  return { count: results.length, next: null, previous: null, results };
}

/** Uma barbearia, por id ou por slug. Equivalente futuro: `GET /api/barbershops/{id}/`. */
export async function getBarbershopById(idOrSlug: string): Promise<Barbershop | null> {
  await tick();
  return barbershops.find((s) => s.id === idOrSlug || s.slug === idOrSlug) ?? null;
}

/** As zonas onde há casa aberta. Alimenta o filtro do primeiro passo. */
export async function getShopAreas(): Promise<string[]> {
  await tick();
  return shopAreas;
}

/**
 * Os barbeiros de uma casa que atendem naquele formato.
 *
 * O formato importa: a casa de Talatona tem dois barbeiros, mas só um atende no
 * salão — o outro é exclusivamente de domicílio. Mostrar os dois a quem escolheu
 * salão daria horas que não existem.
 *
 * Equivalente futuro: `GET /api/barbershops/{id}/barbers/?location_type=`
 */
export async function getShopBarbers(
  shopId: string,
  locationType?: 'salao' | 'domicilio',
): Promise<Barber[]> {
  await tick();
  const shop = barbershops.find((s) => s.id === shopId || s.slug === shopId);
  if (!shop) return [];

  return shop.barberIds
    .map((id) => barbers.find((b) => b.id === id))
    .filter((b): b is Barber => b !== undefined)
    .filter((b) => !locationType || b.locationTypes.includes(locationType));
}

/** A casa onde um barbeiro trabalha, ou `null` se não tiver casa. */
export function shopOfBarber(barber: Barber): Barbershop | null {
  if (!barber.barbershopId) return null;
  return barbershops.find((s) => s.id === barber.barbershopId) ?? null;
}
