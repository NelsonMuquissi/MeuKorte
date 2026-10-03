/**
 * Serviço de marcações.
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
  PaginatedResponse,
  TimeSlot,
  WeekDay,
} from '@/types';
import { barbers } from '@/data/barbers';
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

/** Lê todas as marcações do armazenamento. */
function readBookings(): Booking[] {
  return read<Booking[]>(KEYS.bookings, []);
}

/** Grava todas as marcações e avisa os componentes. */
function writeBookings(bookings: Booking[]): void {
  write(KEYS.bookings, bookings);
  notifyChange();
}

/**
 * Calcula os horários livres de um barbeiro, para um serviço, num dia.
 *
 * O cálculo parte de três coisas: o horário semanal do barbeiro, a duração do
 * serviço escolhido e as marcações que já existem.
 *
 * Regras:
 *  - o serviço tem de caber inteiro dentro de um intervalo de trabalho, por isso
 *    um corte de 75 min não aparece às 12:30 se o turno acabar às 13:00;
 *  - não pode haver sobreposição com marcações existentes, e a sobreposição é
 *    testada com a duração completa dos dois lados, não apenas com a hora de início;
 *  - marcações canceladas libertam o horário;
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

  // Marcações que ocupam este dia, já convertidas em intervalos de minutos.
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
 * Cria uma marcação.
 *
 * Volta a validar a disponibilidade antes de gravar: entre o momento em que o
 * cliente escolheu o horário e o momento em que carregou em confirmar, outra
 * marcação pode ter ocupado o lugar. No Django esta verificação passa a ser feita
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
 * Marcações de um cliente, identificado pelo telemóvel.
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
 * Todas as marcações. Usada pelos painéis de demonstração.
 *
 * Equivalente futuro: `GET /api/bookings/` (só administrador).
 */
export async function getAllBookings(): Promise<PaginatedResponse<Booking>> {
  const results = readBookings().sort((a, b) =>
    `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
  );
  return { count: results.length, next: null, previous: null, results };
}

/** Uma marcação pelo identificador. */
export async function getBookingById(id: string): Promise<Booking | null> {
  return readBookings().find((b) => b.id === id) ?? null;
}

/**
 * Diz se uma marcação ainda pode ser cancelada, segundo a antecedência mínima
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
 * Cancela uma marcação, respeitando a antecedência mínima.
 *
 * Equivalente futuro: `PATCH /api/bookings/{id}/` com `status: "cancelada"`.
 */
export async function cancelBooking(id: string): Promise<Booking> {
  const bookings = readBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) throw new Error('Marcação não encontrada.');

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
 * Muda o estado de uma marcação. Usada pelo painel do barbeiro.
 *
 * Equivalente futuro: `PATCH /api/bookings/{id}/`.
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<Booking> {
  const bookings = readBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) throw new Error('Marcação não encontrada.');

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
