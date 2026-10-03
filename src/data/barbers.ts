/**
 * Barbeiros de demonstração.
 *
 * São 4 porque essa é a meta do MVP: 4 barbeiros parceiros em 90 dias.
 * Os dados são fictícios e servem para validar o fluxo com clientes reais antes
 * de existirem parceiros contratados.
 *
 * Nenhum preço está escrito aqui — todos vêm de `src/config/business.ts`.
 * Na fase Django isto passa a ser a tabela de barbeiros e este ficheiro desaparece.
 */

import type { Barber, WeeklySchedule } from '@/types';
import { PRICING } from '@/config/business';

/** Horário mais comum: segunda a sábado, com pausa de almoço. */
const standardSchedule: WeeklySchedule = {
  0: [], // domingo — folga
  1: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '19:00' }],
  2: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '19:00' }],
  3: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '19:00' }],
  4: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '19:00' }],
  5: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '20:00' }],
  6: [{ start: '08:00', end: '18:00' }], // sábado — dia cheio
};

/** Quem atende sobretudo ao domicílio, depois do horário de escritório. */
const eveningSchedule: WeeklySchedule = {
  0: [],
  1: [{ start: '14:00', end: '21:00' }],
  2: [{ start: '14:00', end: '21:00' }],
  3: [{ start: '14:00', end: '21:00' }],
  4: [{ start: '14:00', end: '21:00' }],
  5: [{ start: '14:00', end: '21:00' }],
  6: [{ start: '09:00', end: '19:00' }],
};

/** Horário de quem concilia a barbearia com outro trabalho. */
const partTimeSchedule: WeeklySchedule = {
  0: [],
  1: [], // segunda — folga
  2: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
  3: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
  4: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }],
  5: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '20:00' }],
  6: [{ start: '08:30', end: '17:00' }],
};

export const barbers: Barber[] = [
  {
    id: '1',
    slug: 'edson-kiala',
    name: 'Edson Kiala',
    photo: '/barbers/edson-kiala.jpg',
    bio: 'Doze anos a cortar em Luanda. Especialista em degradê e em desenhos à navalha. Trabalha devagar nos acabamentos e rápido no resto — a maioria dos cortes fica pronta em 45 minutos.',
    specialties: ['Degradê', 'Navalha', 'Desenho'],
    area: 'Talatona',
    locationTypes: ['salao', 'domicilio'],
    schedule: standardSchedule,
    yearsOfExperience: 12,
    rating: 4.8,
    reviewCount: 34,
    services: [
      {
        id: '1-corte',
        name: 'Corte degradê',
        durationMinutes: 45,
        price: PRICING.standardCut,
        description: 'Corte completo com degradê e acabamento à navalha.',
      },
      {
        id: '1-corte-barba',
        name: 'Corte + barba',
        durationMinutes: 75,
        price: PRICING.cutAndBeard,
        description: 'Corte degradê com barba desenhada e toalha quente.',
      },
      {
        id: '1-barba',
        name: 'Barba',
        durationMinutes: 30,
        price: PRICING.beard,
        description: 'Barba aparada e desenhada, com toalha quente.',
      },
      {
        id: '1-retoque',
        name: 'Retoque',
        durationMinutes: 20,
        price: PRICING.lineUp,
        description: 'Acabamento entre cortes, para manter a linha.',
      },
    ],
  },
  {
    id: '2',
    slug: 'nelson-bumba',
    name: 'Nelson Bumba',
    photo: '/barbers/nelson-bumba.jpg',
    bio: 'Trabalha quase sempre ao domicílio, ao fim da tarde, para quem sai tarde do escritório. Leva o material todo e deixa a casa como encontrou.',
    specialties: ['Ao domicílio', 'Corte clássico', 'Máquina'],
    area: 'Benfica',
    locationTypes: ['domicilio'],
    schedule: eveningSchedule,
    yearsOfExperience: 7,
    rating: 4.9,
    reviewCount: 21,
    services: [
      {
        id: '2-corte',
        name: 'Corte em casa',
        durationMinutes: 45,
        price: PRICING.standardCut,
        description: 'Corte completo na tua casa, com material próprio.',
      },
      {
        id: '2-corte-barba',
        name: 'Corte + barba em casa',
        durationMinutes: 75,
        price: PRICING.cutAndBeard,
        description: 'Corte e barba sem saíres de casa.',
      },
      {
        id: '2-infantil',
        name: 'Corte infantil',
        durationMinutes: 30,
        price: PRICING.kidsCut,
        description: 'Para os mais novos, com calma e no conforto de casa.',
      },
    ],
  },
  {
    id: '3',
    slug: 'joao-ferreira',
    name: 'João Ferreira',
    photo: '/barbers/joao-ferreira.jpg',
    bio: 'Barbeiro de barba antes de ser de cabelo. Faz o trabalho clássico de toalha quente e navalha, e é quem mais corta crianças no Kilamba.',
    specialties: ['Barba', 'Toalha quente', 'Infantil'],
    area: 'Kilamba',
    locationTypes: ['salao'],
    schedule: partTimeSchedule,
    yearsOfExperience: 15,
    rating: 4.7,
    reviewCount: 48,
    services: [
      {
        id: '3-corte',
        name: 'Corte clássico',
        durationMinutes: 40,
        price: PRICING.standardCut,
        description: 'Corte à tesoura, no estilo clássico.',
      },
      {
        id: '3-barba',
        name: 'Barba completa',
        durationMinutes: 40,
        price: PRICING.beard,
        description: 'Navalha, toalha quente e óleo. O trabalho feito à antiga.',
      },
      {
        id: '3-corte-barba',
        name: 'Corte + barba',
        durationMinutes: 75,
        price: PRICING.cutAndBeard,
      },
      {
        id: '3-infantil',
        name: 'Corte infantil',
        durationMinutes: 30,
        price: PRICING.kidsCut,
        description: 'Paciência a sério para os mais pequenos.',
      },
    ],
  },
  {
    id: '4',
    slug: 'mauro-dos-santos',
    name: 'Mauro dos Santos',
    photo: '/barbers/mauro-dos-santos.jpg',
    bio: 'O mais novo da equipa e o que mais acompanha o que sai no TikTok. Se levares uma foto, ele faz igual. Atende no salão e também vai a casa.',
    specialties: ['Degradê', 'Desenho', 'Platinado'],
    area: 'Camama',
    locationTypes: ['salao', 'domicilio'],
    schedule: standardSchedule,
    yearsOfExperience: 4,
    rating: 4.6,
    reviewCount: 17,
    services: [
      {
        id: '4-corte',
        name: 'Corte degradê',
        durationMinutes: 45,
        price: PRICING.standardCut,
        description: 'Levas a foto, ele faz o corte.',
      },
      {
        id: '4-desenho',
        name: 'Corte + desenho',
        durationMinutes: 60,
        price: PRICING.cutAndBeard,
        description: 'Corte com desenho à navalha, à tua escolha.',
      },
      {
        id: '4-retoque',
        name: 'Retoque',
        durationMinutes: 20,
        price: PRICING.lineUp,
        description: 'Para manter o corte afiado entre marcações.',
      },
    ],
  },
];

/** Todas as especialidades existentes, sem repetições, para os filtros. */
export const allSpecialties: string[] = Array.from(
  new Set(barbers.flatMap((b) => b.specialties)),
).sort((a, b) => a.localeCompare(b, 'pt'));

/** Todas as zonas onde há barbeiros, para os filtros. */
export const allAreas: string[] = Array.from(
  new Set(barbers.map((b) => b.area)),
).sort((a, b) => a.localeCompare(b, 'pt'));
