/**
 * Serviço de agendamentos.
 *
 * Hoje guarda no `localStorage`, através de `storage.ts`. Na fase Django passa a
 * `POST /api/bookings/` e companhia, com as mesmas assinaturas.
 *
 * O cálculo de horários livres (`getAvailableSlots`) é a peça central e está
 * coberta por testes em `bookingsService.test.ts`.
 */

import type {
  Booking,
  BookingInput,
  BookingStatus,
  LocationType,
  PaginatedResponse,
  ServiceType,
  ShopTimeSlot,
  TimeSlot,
  WeekDay,
} from '@/types';
import { barbers } from '@/data/barbers';
import { barbershops } from '@/data/barbershops';
import {
  SLOT_INTERVAL_MINUTES,
  MIN_BOOKING_NOTICE_HOURS,
  CANCELLATION,
  PRICING,
} from '@/config/business';
import { timeToMinutes, minutesToTime, parseDate, normalizePhone } from '@/lib/format';
import { read, write, KEYS, generateId, notifyChange } from './storage';

/** Estados que continuam a ocupar o horário do barbeiro. */
const BLOCKING_STATUSES: BookingStatus[] = ['pendente', 'confirmada', 'concluida'];

/** Lê todos os agendamentos do armazenamento. */
function readBookings(): Booking[] {
  return read<Booking[]>(KEYS.bookings, []);
}

/** Grava todos os agendamentos e avisa os componentes. */
function writeBookings(bookings: Booking[]): void {
  write(KEYS.bookings, bookings);
  notifyChange();
}

/**
 * Calcula os horários livres de um barbeiro, para um serviço, num dia.
 *
 * O cálculo parte de três coisas: o horário semanal do barbeiro, a duração do
 * serviço escolhido e os agendamentos que já existem.
 *
 * Regras:
 *  - o serviço tem de caber inteiro dentro de um intervalo de trabalho, por isso
 *    um corte de 75 min não aparece às 12:30 se o turno acabar às 13:00;
 *  - não pode haver sobreposição com agendamentos existentes, e a sobreposição é
 *    testada com a duração completa dos dois lados, não apenas com a hora de início;
 *  - agendamentos cancelados libertam o horário;
 *  - nada no passado, e nada antes da antecedência mínima.
 *
 * @param now Injectável para que os testes sejam deterministas. Em produção é
 *            sempre a hora actual.
 *
 * Equivalente futuro: `GET /api/barbers/{id}/slots/?service=&date=`
 */
export async function getAvailableSlots(
  barberId: string,
  serviceId: string,
  date: string,
  now: Date = new Date(),
): Promise<TimeSlot[]> {
  const barber = barbers.find((b) => b.id === barberId || b.slug === barberId);
  if (!barber) return [];

  const service = barber.services.find((s) => s.id === serviceId);
  if (!service) return [];

  const weekDay = parseDate(date).getDay() as WeekDay;
  const ranges = barber.schedule[weekDay] ?? [];
  if (ranges.length === 0) return []; // dia de folga

  // Agendamentos que ocupam este dia, já convertidas em intervalos de minutos.
  const busy = readBookings()
    .filter(
      (b) =>
        b.barberId === barber.id &&
        b.date === date &&
        BLOCKING_STATUSES.includes(b.status),
    )
    .map((b) => {
      const start = timeToMinutes(b.time);
      return { start, end: start + b.durationMinutes };
    });

  // Limite inferior: só conta se o dia pedido for hoje. Num dia futuro, todos os
  // horários do turno são candidatos.
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = date === today;
  const earliestToday = isToday
    ? now.getHours() * 60 + now.getMinutes() + MIN_BOOKING_NOTICE_HOURS * 60
    : -Infinity;
  const isPastDay = date < today;

  const slots: TimeSlot[] = [];

  for (const range of ranges) {
    const rangeStart = timeToMinutes(range.start);
    const rangeEnd = timeToMinutes(range.end);

    for (
      let start = rangeStart;
      start + service.durationMinutes <= rangeEnd;
      start += SLOT_INTERVAL_MINUTES
    ) {
      const end = start + service.durationMinutes;

      // Sobreposição: dois intervalos cruzam-se se cada um começa antes de o
      // outro acabar. Os limites tocam-se sem conflito (10:00–10:45 e 10:45–11:30).
      const overlaps = busy.some((b) => start < b.end && b.start < end);

      let available = true;
      let reason: TimeSlot['reason'];

      if (isPastDay || start < earliestToday) {
        available = false;
        reason = 'passado';
      } else if (overlaps) {
        available = false;
        reason = 'ocupado';
      }

      slots.push({ time: minutesToTime(start), available, reason });
    }
  }

  // Os turnos vêm por ordem, mas ordenar protege contra dados mal introduzidos.
  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Horas livres de uma barbearia inteira, num dia, para um tipo de serviço.
 *
 * É o que a jornada do salão precisa quando o cliente não quer escolher
 * barbeiro: ele pergunta "a que horas podem atender-me?", não "a que horas está
 * o Edson livre?". Uma hora está livre se PELO MENOS UM barbeiro da casa a
 * tiver livre, e cada hora traz consigo a lista de quem a tem — é essa lista
 * que depois permite atribuir um barbeiro sem voltar a calcular tudo.
 *
 * Duas regras que não são óbvias:
 *
 *  - o formato filtra os barbeiros antes da conta. A casa de Talatona tem dois,
 *    mas um só faz domicílio: oferecê-lo a quem escolheu salão daria horas que
 *    não existem;
 *  - no salão, a casa manda. Um barbeiro cujo horário pessoal passe da hora de
 *    fecho não atende depois do fecho, porque a porta está trancada. Ao
 *    domicílio não se aplica: aí a casa não entra.
 *
 * Cada barbeiro tem o seu próprio serviço para o mesmo tipo, com a sua duração,
 * por isso a conta é feita barbeiro a barbeiro e só depois reunida.
 *
 * Equivalente futuro: `GET /api/barbershops/{id}/slots/?service_type=&date=&location_type=`
 */
export async function getShopSlots(
  shopId: string,
  serviceType: ServiceType,
  date: string,
  locationType: LocationType,
  now: Date = new Date(),
): Promise<ShopTimeSlot[]> {
  const shop = barbershops.find((s) => s.id === shopId || s.slug === shopId);
  if (!shop) return [];

  const eligible = shop.barberIds
    .map((id) => barbers.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined)
    .filter((b) => b.locationTypes.includes(locationType));

  if (eligible.length === 0) return [];

  // No salão, nada antes de abrir nem depois de fechar.
  const weekDay = parseDate(date).getDay() as WeekDay;
  const shopRanges = locationType === 'salao' ? shop.schedule[weekDay] ?? [] : null;
  if (shopRanges !== null && shopRanges.length === 0) return []; // casa fechada

  const withinShopHours = (time: string, durationMinutes: number): boolean => {
    if (shopRanges === null) return true;
    const start = timeToMinutes(time);
    const end = start + durationMinutes;
    return shopRanges.some(
      (r) => start >= timeToMinutes(r.start) && end <= timeToMinutes(r.end),
    );
  };

  /** Por hora: quem a tem livre, e a melhor razão quando ninguém a tem. */
  const byTime = new Map<string, { free: string[]; reason?: TimeSlot['reason'] }>();

  for (const barber of eligible) {
    const service = barber.services.find((s) => s.type === serviceType);
    if (!service) continue; // este barbeiro não presta este serviço

    const slots = await getAvailableSlots(barber.id, service.id, date, now);

    for (const slot of slots) {
      if (!withinShopHours(slot.time, service.durationMinutes)) continue;

      const entry = byTime.get(slot.time) ?? { free: [] };
      if (slot.available) {
        entry.free.push(barber.id);
      } else if (entry.free.length === 0) {
        // "Ocupado" é mais informativo do que "passado": se uma hora já passou
        // para um barbeiro, passou para todos, mas se está ocupada é porque
        // alguém a tem marcada. Guarda-se a razão mais útil ao cliente.
        entry.reason = entry.reason === 'ocupado' ? entry.reason : slot.reason;
      }
      byTime.set(slot.time, entry);
    }
  }

  return [...byTime.entries()]
    .map(([time, { free, reason }]) => ({
      time,
      available: free.length > 0,
      reason: free.length > 0 ? undefined : reason,
      barberIds: free,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Cria um agendamento.
 *
 * Volta a validar a disponibilidade antes de gravar: entre o momento em que o
 * cliente escolheu o horário e o momento em que carregou em confirmar, outra
 * agendamento pode ter ocupado o lugar. No Django esta verificação passa a ser feita
 * no servidor, dentro da transacção.
 *
 * Equivalente futuro: `POST /api/bookings/`
 */
export async function createBooking(data: BookingInput): Promise<Booking> {
  const phone = normalizePhone(data.clientPhone);
  if (!phone) {
    throw new Error('O número de telemóvel não é válido.');
  }

  const slots = await getAvailableSlots(data.barberId, data.serviceId, data.date);
  const slot = slots.find((s) => s.time === data.time);
  if (!slot || !slot.available) {
    throw new Error('Esse horário já não está disponível. Escolhe outro.');
  }

  const booking: Booking = {
    ...data,
    clientPhone: phone,
    id: generateId(),
    status: 'pendente',
    createdAt: new Date().toISOString(),
  };

  writeBookings([...readBookings(), booking]);
  return booking;
}

/**
 * Agendamentos de um cliente, identificado pelo telemóvel.
 *
 * Equivalente futuro: `GET /api/bookings/?phone=` (autenticado).
 */
export async function getBookingsByPhone(
  phone: string,
): Promise<PaginatedResponse<Booking>> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { count: 0, next: null, previous: null, results: [] };
  }

  const results = readBookings()
    .filter((b) => b.clientPhone === normalized)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  return { count: results.length, next: null, previous: null, results };
}

/**
 * Todos os agendamentos. Usada pelos painéis de demonstração.
 *
 * Equivalente futuro: `GET /api/bookings/` (só administrador).
 */
export async function getAllBookings(): Promise<PaginatedResponse<Booking>> {
  const results = readBookings().sort((a, b) =>
    `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
  );
  return { count: results.length, next: null, previous: null, results };
}

/** Umo agendamento pelo identificador. */
export async function getBookingById(id: string): Promise<Booking | null> {
  return readBookings().find((b) => b.id === id) ?? null;
}

/**
 * Diz se um agendamento ainda pode ser cancelada, segundo a antecedência mínima
 * definida em `business.ts`.
 */
export function canCancel(booking: Booking, now: Date = new Date()): boolean {
  if (booking.status === 'cancelada' || booking.status === 'concluida') return false;
  const when = parseDate(booking.date);
  when.setMinutes(when.getMinutes() + timeToMinutes(booking.time));
  const hoursUntil = (when.getTime() - now.getTime()) / 3_600_000;
  return hoursUntil >= CANCELLATION.minHoursBefore;
}

/**
 * Cancela um agendamento, respeitando a antecedência mínima.
 *
 * Equivalente futuro: `PATCH /api/bookings/{id}/` com `status: "cancelada"`.
 */
export async function cancelBooking(id: string): Promise<Booking> {
  const bookings = readBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) throw new Error('Agendamento não encontrado.');

  if (!canCancel(booking)) {
    throw new Error(
      `Só é possível cancelar com ${CANCELLATION.minHoursBefore}h de antecedência. Fala connosco pelo WhatsApp.`,
    );
  }

  const updated: Booking = { ...booking, status: 'cancelada' };
  writeBookings(bookings.map((b) => (b.id === id ? updated : b)));
  return updated;
}

/**
 * Muda o estado de um agendamento. Usada pelo painel do barbeiro.
 *
 * Equivalente futuro: `PATCH /api/bookings/{id}/`.
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<Booking> {
  const bookings = readBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) throw new Error('Agendamento não encontrado.');

  const updated: Booking = { ...booking, status };
  writeBookings(bookings.map((b) => (b.id === id ? updated : b)));
  return updated;
}

/**
 * Preço final de um serviço, com a taxa de deslocação quando é ao domicílio.
 * A taxa vem de `business.ts` e está por confirmar.
 */
export function calculatePrice(
  servicePrice: number,
  locationType: 'salao' | 'domicilio',
): number {
  return locationType === 'domicilio'
    ? servicePrice + PRICING.homeServiceFee
    : servicePrice;
}
