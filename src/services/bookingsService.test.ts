/**
 * Testes de `getAvailableSlots`.
 *
 * É a função mais delicada da aplicação: um erro aqui marca dois clientes para o
 * mesmo barbeiro à mesma hora. A fase 3 do plano do MVP pede explicitamente que os
 * conflitos de horários sejam validados.
 *
 * Os testes usam a data de 7 de Outubro de 2026, uma quarta-feira, e injectam
 * sempre o `now` para não dependerem do relógio de quem corre os testes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAvailableSlots, getShopSlots, createBooking, canCancel } from './bookingsService';
import { KEYS } from './storage';
import type { Booking } from '@/types';

/** Quarta-feira. Edson trabalha 09:00–13:00 e 14:00–19:00. */
const WEDNESDAY = '2026-10-07';
/** Domingo — folga para todos os barbeiros. */
const SUNDAY = '2026-10-11';

const EDSON = '1';
const CUT_45 = '1-corte'; // 45 min
const CUT_BEARD_75 = '1-corte-barba'; // 75 min
const TOUCHUP_20 = '1-retoque'; // 20 min

/** Hora de referência: muito antes do dia testado, para nada cair no passado. */
const EARLY = new Date(2026, 9, 1, 8, 0);

/**
 * `localStorage` de mentira, para o ambiente `node` do Vitest.
 * Reposto antes de cada teste, para que os testes não se contaminem.
 */
function installFakeStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    dispatchEvent: () => true,
  });
  return store;
}

/** Põe agendamentos directamente no armazenamento, sem passar pelas validações. */
function seedBookings(store: Map<string, string>, bookings: Partial<Booking>[]): void {
  const full = bookings.map((b, i) => ({
    id: `seed-${i}`,
    barberId: EDSON,
    barberName: 'Edson Kiala',
    serviceId: CUT_45,
    serviceName: 'Corte degradê',
    price: 5000,
    durationMinutes: 45,
    date: WEDNESDAY,
    time: '10:00',
    locationType: 'salao',
    clientName: 'Cliente',
    clientPhone: '+244923000000',
    status: 'confirmada',
    createdAt: '2026-10-01T08:00:00.000Z',
    ...b,
  }));
  store.set(`meukorte:${KEYS.bookings}`, JSON.stringify(full));
}

let store: Map<string, string>;

beforeEach(() => {
  store = installFakeStorage();
  seedBookings(store, []);
});

describe('getAvailableSlots — grelha base', () => {
  it('gera intervalos de 30 em 30 minutos dentro do horário do barbeiro', async () => {
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    expect(slots[0].time).toBe('09:00');
    expect(slots[1].time).toBe('09:30');
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('não deixa o serviço passar do fim do turno', async () => {
    // Turno da manhã acaba às 13:00. Um corte de 45 min não cabe depois das 12:15.
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);
    const morning = slots.filter((s) => s.time < '14:00');

    expect(morning.at(-1)?.time).toBe('12:00');
    expect(morning.some((s) => s.time === '12:30')).toBe(false);
  });

  it('um serviço mais longo tem menos horários disponíveis', async () => {
    const short = await getAvailableSlots(EDSON, TOUCHUP_20, WEDNESDAY, EARLY);
    const long = await getAvailableSlots(EDSON, CUT_BEARD_75, WEDNESDAY, EARLY);

    expect(long.length).toBeLessThan(short.length);
    // 75 min a partir das 11:30 bate nas 12:45 — ainda cabe antes das 13:00.
    const morning = long.filter((s) => s.time < '14:00');
    expect(morning.at(-1)?.time).toBe('11:30');
  });

  it('respeita a pausa de almoço entre os dois turnos', async () => {
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);
    const times = slots.map((s) => s.time);

    expect(times).toContain('12:00');
    expect(times).not.toContain('13:00');
    expect(times).not.toContain('13:30');
    expect(times).toContain('14:00');
  });

  it('devolve lista vazia num dia de folga', async () => {
    const slots = await getAvailableSlots(EDSON, CUT_45, SUNDAY, EARLY);
    expect(slots).toEqual([]);
  });

  it('devolve lista vazia para barbeiro ou serviço inexistente', async () => {
    expect(await getAvailableSlots('999', CUT_45, WEDNESDAY, EARLY)).toEqual([]);
    expect(await getAvailableSlots(EDSON, 'nao-existe', WEDNESDAY, EARLY)).toEqual([]);
  });
});

describe('getAvailableSlots — conflitos de horário', () => {
  it('bloqueia a hora exacta de um agendamento existente', async () => {
    seedBookings(store, [{ time: '10:00', durationMinutes: 45 }]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    const ten = slots.find((s) => s.time === '10:00');
    expect(ten?.available).toBe(false);
    expect(ten?.reason).toBe('ocupado');
  });

  it('bloqueia o intervalo seguinte quando o serviço o invade', async () => {
    // 10:00 + 45 min = 10:45, por isso as 10:30 ficam dentro do agendamento.
    seedBookings(store, [{ time: '10:00', durationMinutes: 45 }]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    expect(slots.find((s) => s.time === '10:30')?.available).toBe(false);
  });

  it('bloqueia o intervalo anterior quando o novo serviço entraria no agendamento', async () => {
    // Um corte às 09:30 acabaria às 10:15 e apanhava o agendamento das 10:00.
    seedBookings(store, [{ time: '10:00', durationMinutes: 45 }]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    expect(slots.find((s) => s.time === '09:30')?.available).toBe(false);
    expect(slots.find((s) => s.time === '09:00')?.available).toBe(true);
  });

  it('deixa agendar quando os horários só se tocam nos limites', async () => {
    // Agendamento 10:00–10:45. Um corte às 10:45 começa exactamente no fim: sem conflito.
    seedBookings(store, [{ time: '10:00', durationMinutes: 45 }]);
    const slots = await getAvailableSlots(EDSON, TOUCHUP_20, WEDNESDAY, EARLY);

    expect(slots.find((s) => s.time === '09:30')?.available).toBe(true); // 09:30–09:50
    expect(slots.find((s) => s.time === '11:00')?.available).toBe(true);
  });

  it('um agendamento longa bloqueia todos os intervalos que atravessa', async () => {
    seedBookings(store, [{ time: '10:00', durationMinutes: 75 }]); // 10:00–11:15
    const slots = await getAvailableSlots(EDSON, TOUCHUP_20, WEDNESDAY, EARLY);
    const blocked = (t: string) => slots.find((s) => s.time === t)?.available;

    expect(blocked('10:00')).toBe(false);
    expect(blocked('10:30')).toBe(false);
    expect(blocked('11:00')).toBe(false); // 11:00–11:20 ainda apanha as 11:15
    expect(blocked('11:30')).toBe(true);
  });

  it('um agendamento cancelado liberta o horário', async () => {
    seedBookings(store, [{ time: '10:00', status: 'cancelada' }]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    expect(slots.find((s) => s.time === '10:00')?.available).toBe(true);
  });

  it('agendamentos pendentes e concluídos continuam a ocupar o horário', async () => {
    seedBookings(store, [
      { time: '10:00', status: 'pendente' },
      { time: '15:00', status: 'concluida' },
    ]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    expect(slots.find((s) => s.time === '10:00')?.available).toBe(false);
    expect(slots.find((s) => s.time === '15:00')?.available).toBe(false);
  });

  it('ignoro agendamentos de outro barbeiro', async () => {
    seedBookings(store, [{ time: '10:00', barberId: '4' }]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    expect(slots.find((s) => s.time === '10:00')?.available).toBe(true);
  });

  it('ignoro agendamentos noutro dia', async () => {
    seedBookings(store, [{ time: '10:00', date: '2026-10-08' }]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);

    expect(slots.find((s) => s.time === '10:00')?.available).toBe(true);
  });

  it('vários agendamentos no mesmo dia bloqueiam todas as suas janelas', async () => {
    seedBookings(store, [
      { time: '09:00', durationMinutes: 45 }, // 09:00–09:45
      { time: '14:00', durationMinutes: 75 }, // 14:00–15:15
    ]);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, EARLY);
    const at = (t: string) => slots.find((s) => s.time === t)?.available;

    expect(at('09:00')).toBe(false);
    expect(at('09:30')).toBe(false);
    expect(at('10:00')).toBe(true);
    expect(at('14:00')).toBe(false);
    expect(at('14:30')).toBe(false);
    expect(at('15:00')).toBe(false); // 15:00–15:45 apanha o fim das 15:15
    expect(at('15:30')).toBe(true);
  });
});

describe('getAvailableSlots — horários no passado', () => {
  it('marca como passado tudo o que já aconteceu hoje', async () => {
    // Agora: quarta-feira, 11:00. Antecedência mínima de 1h ⇒ só a partir das 12:00.
    const now = new Date(2026, 9, 7, 11, 0);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, now);

    expect(slots.find((s) => s.time === '09:00')?.available).toBe(false);
    expect(slots.find((s) => s.time === '09:00')?.reason).toBe('passado');
    expect(slots.find((s) => s.time === '11:30')?.available).toBe(false);
    expect(slots.find((s) => s.time === '12:00')?.available).toBe(true);
  });

  it('respeita a antecedência mínima de uma hora', async () => {
    const now = new Date(2026, 9, 7, 14, 10);
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, now);

    // 15:00 está a 50 min de distância — ainda dentro da antecedência mínima.
    expect(slots.find((s) => s.time === '15:00')?.available).toBe(false);
    expect(slots.find((s) => s.time === '15:30')?.available).toBe(true);
  });

  it('num dia futuro nada é considerado passado', async () => {
    const now = new Date(2026, 9, 6, 23, 0); // terça à noite
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, now);

    expect(slots.every((s) => s.reason !== 'passado')).toBe(true);
    expect(slots.find((s) => s.time === '09:00')?.available).toBe(true);
  });

  it('num dia já passado nada fica disponível', async () => {
    const now = new Date(2026, 9, 9, 10, 0); // sexta
    const slots = await getAvailableSlots(EDSON, CUT_45, WEDNESDAY, now);

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => !s.available && s.reason === 'passado')).toBe(true);
  });
});

describe('createBooking', () => {
  // 2099-10-07 também é uma quarta-feira, por isso o horário do Edson é o mesmo.
  // A data tem de estar no futuro para o horário não ser recusado por já ter passado.
  const FUTURE_WEDNESDAY = '2099-10-07';

  it('recusa um horário já ocupado', async () => {
    seedBookings(store, [
      { time: '10:00', durationMinutes: 45, date: FUTURE_WEDNESDAY },
    ]);

    await expect(
      createBooking({
        barberId: EDSON,
        barberName: 'Edson Kiala',
        serviceId: CUT_45,
        serviceName: 'Corte degradê',
        price: 5000,
        durationMinutes: 45,
        date: FUTURE_WEDNESDAY,
        time: '10:00',
        locationType: 'salao',
        clientName: 'Teste',
        clientPhone: '923456789',
      }),
    ).rejects.toThrow(/já não está disponível/);
  });

  it('recusa um telemóvel inválido', async () => {
    await expect(
      createBooking({
        barberId: EDSON,
        barberName: 'Edson Kiala',
        serviceId: CUT_45,
        serviceName: 'Corte degradê',
        price: 5000,
        durationMinutes: 45,
        date: WEDNESDAY,
        time: '10:00',
        locationType: 'salao',
        clientName: 'Teste',
        clientPhone: '12345',
      }),
    ).rejects.toThrow(/telemóvel/);
  });
});

describe('canCancel', () => {
  const booking = {
    id: 'x',
    date: WEDNESDAY,
    time: '15:00',
    status: 'confirmada',
  } as Booking;

  it('deixa cancelar com antecedência suficiente', () => {
    expect(canCancel(booking, new Date(2026, 9, 7, 10, 0))).toBe(true);
  });

  it('não deixa cancelar dentro das 2 horas anteriores', () => {
    expect(canCancel(booking, new Date(2026, 9, 7, 13, 30))).toBe(false);
  });

  it('não deixa cancelar o que já foi concluído ou cancelado', () => {
    const early = new Date(2026, 9, 7, 8, 0);
    expect(canCancel({ ...booking, status: 'concluida' }, early)).toBe(false);
    expect(canCancel({ ...booking, status: 'cancelada' }, early)).toBe(false);
  });
});

/* ========================================================================== */
/* getShopSlots — a grelha de uma casa inteira                                */
/* ========================================================================== */

/**
 * A casa de Talatona (`s1`) tem dois barbeiros:
 *  - Edson Kiala (`1`), salão e domicílio, 09:00–13:00 e 14:00–19:00;
 *  - Nelson Bumba (`2`), SÓ domicílio, 14:00–21:00.
 *
 * A casa abre 08:00–20:00 de segunda a sexta.
 */
const TALATONA = 's1';
const NELSON = '2';

describe('getShopSlots — formato filtra os barbeiros', () => {
  it('no salão ignora quem só faz domicílio', async () => {
    const slots = await getShopSlots(TALATONA, 'corte', WEDNESDAY, 'salao', EARLY);

    // Nelson só trabalha a partir das 14:00 e só ao domicílio. Se entrasse na
    // conta, as 19:00 apareciam livres — o Edson já saiu a essa hora.
    expect(slots.some((s) => s.time === '19:00' && s.available)).toBe(false);
    expect(slots.every((s) => !s.barberIds.includes(NELSON))).toBe(true);
  });

  it('ao domicílio conta os dois, e a casa deixa de mandar', async () => {
    const salao = await getShopSlots(TALATONA, 'corte', WEDNESDAY, 'salao', EARLY);
    const casa = await getShopSlots(TALATONA, 'corte', WEDNESDAY, 'domicilio', EARLY);

    // Nelson vai até às 21:00; a casa fecha às 20:00. Ao domicílio isso não
    // importa, por isso há horas tardias que o salão não tem.
    expect(casa.some((s) => s.time >= '19:00' && s.available)).toBe(true);
    expect(salao.some((s) => s.time >= '19:00' && s.available)).toBe(false);
    expect(casa.some((s) => s.barberIds.includes(NELSON))).toBe(true);
  });
});

describe('getShopSlots — hora livre é hora de alguém', () => {
  it('cada hora diz quem a tem livre', async () => {
    const slots = await getShopSlots(TALATONA, 'corte', WEDNESDAY, 'salao', EARLY);
    const first = slots.find((s) => s.available);

    expect(first?.barberIds).toContain(EDSON);
  });

  it('a hora fica livre enquanto houver um barbeiro livre', async () => {
    // Nelson ocupado às 15:00; Edson livre. Ao domicílio a hora continua a dar.
    seedBookings(store, [
      { barberId: NELSON, barberName: 'Nelson Bumba', serviceId: '2-corte',
        durationMinutes: 40, date: WEDNESDAY, time: '15:00', locationType: 'domicilio' },
    ]);

    const slots = await getShopSlots(TALATONA, 'corte', WEDNESDAY, 'domicilio', EARLY);
    const at15 = slots.find((s) => s.time === '15:00');

    expect(at15?.available).toBe(true);
    expect(at15?.barberIds).toContain(EDSON);
    expect(at15?.barberIds).not.toContain(NELSON);
  });

  it('a hora só fecha quando todos estão ocupados', async () => {
    seedBookings(store, [
      { barberId: EDSON, barberName: 'Edson Kiala', serviceId: CUT_45,
        durationMinutes: 45, date: WEDNESDAY, time: '15:00', locationType: 'domicilio' },
      { barberId: NELSON, barberName: 'Nelson Bumba', serviceId: '2-corte',
        durationMinutes: 40, date: WEDNESDAY, time: '15:00', locationType: 'domicilio' },
    ]);

    const slots = await getShopSlots(TALATONA, 'corte', WEDNESDAY, 'domicilio', EARLY);
    const at15 = slots.find((s) => s.time === '15:00');

    expect(at15?.available).toBe(false);
    expect(at15?.barberIds).toEqual([]);
    expect(at15?.reason).toBe('ocupado');
  });
});

describe('getShopSlots — casos de fronteira', () => {
  it('ao domingo não há nada, porque ninguém trabalha', async () => {
    const slots = await getShopSlots(TALATONA, 'corte', SUNDAY, 'salao', EARLY);
    expect(slots.every((s) => !s.available)).toBe(true);
  });

  it('uma casa que não existe devolve lista vazia', async () => {
    expect(await getShopSlots('nao-existe', 'corte', WEDNESDAY, 'salao', EARLY)).toEqual([]);
  });

  it('um serviço que a casa não presta devolve lista vazia', async () => {
    // Nenhum barbeiro de Talatona tem serviço do tipo "infantil".
    expect(await getShopSlots(TALATONA, 'infantil', WEDNESDAY, 'salao', EARLY)).toEqual([]);
  });

  it('uma casa só de salão não dá horas ao domicílio', async () => {
    // Kilamba (`s2`) tem só o João, que não faz domicílio.
    expect(await getShopSlots('s2', 'corte', WEDNESDAY, 'domicilio', EARLY)).toEqual([]);
  });
});
