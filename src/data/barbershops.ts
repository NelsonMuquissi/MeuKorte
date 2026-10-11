/**
 * Barbearias de demonstração.
 *
 * Os dados são fictícios, como os dos barbeiros, e servem para validar a
 * jornada do salão com clientes reais antes de existirem casas contratadas.
 * Na fase Django isto passa a ser uma tabela e este ficheiro desaparece.
 *
 * Os nomes são descritivos de propósito — "Barbearia Talatona" e não um nome
 * de fantasia — para ninguém confundir uma casa de demonstração com um
 * parceiro a sério, e para não colidirem com negócios que existem mesmo.
 *
 * As zonas são as de `PILOT_AREA.homeServiceAreas`, em `business.ts`. Nenhuma
 * morada aqui é real.
 */

import type { Barbershop, WeeklySchedule } from '@/types';

/**
 * Horário de porta aberta de uma casa.
 *
 * É mais largo do que o de qualquer barbeiro: a casa abre às 08:00 e o barbeiro
 * pode só começar às 09:00. O que limita o cliente é a intersecção dos dois, e
 * quem faz essa conta é o `bookingsService`.
 */
const shopHours: WeeklySchedule = {
  0: [], // domingo — fechado
  1: [{ start: '08:00', end: '20:00' }],
  2: [{ start: '08:00', end: '20:00' }],
  3: [{ start: '08:00', end: '20:00' }],
  4: [{ start: '08:00', end: '20:00' }],
  5: [{ start: '08:00', end: '21:00' }],
  6: [{ start: '08:00', end: '18:00' }], // sábado
};

export const barbershops: Barbershop[] = [
  {
    id: 's1',
    slug: 'talatona',
    name: 'Barbearia Talatona',
    address: 'Via S8, junto ao Belas Shopping, Talatona', // PROVISÓRIO — morada fictícia
    area: 'Talatona',
    photo: '/images/shop-talatona.jpg',
    description: 'Dois barbeiros, atendimento no salão e ao domicílio.',
    locationTypes: ['salao', 'domicilio'],
    schedule: shopHours,
    barberIds: ['1', '2'], // Edson Kiala (salão + domicílio), Nelson Bumba (só domicílio)
  },
  {
    id: 's2',
    slug: 'kilamba',
    name: 'Barbearia Kilamba',
    address: 'Edifício R4, Centralidade do Kilamba', // PROVISÓRIO — morada fictícia
    area: 'Kilamba',
    photo: '/images/shop-kilamba.jpg',
    description: 'Cortes clássicos e toalha quente. Só no salão.',
    locationTypes: ['salao'],
    schedule: shopHours,
    barberIds: ['3'], // João Ferreira
  },
  {
    id: 's3',
    slug: 'camama',
    name: 'Barbearia Camama',
    address: 'Rua do Mercado, Camama', // PROVISÓRIO — morada fictícia
    area: 'Camama',
    photo: '/images/shop-camama.jpg',
    description: 'Degradê e desenho. Salão e domicílio nas zonas vizinhas.',
    locationTypes: ['salao', 'domicilio'],
    schedule: shopHours,
    barberIds: ['4'], // Mauro dos Santos
  },
];

/** As zonas onde há casa aberta, sem repetições e por ordem alfabética. */
export const shopAreas: string[] = [...new Set(barbershops.map((s) => s.area))].sort();

export function getBarbershopById(idOrSlug: string): Barbershop | undefined {
  return barbershops.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
}
