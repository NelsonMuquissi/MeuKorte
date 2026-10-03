'use client';

import { useMemo, useState } from 'react';
import { useIsClient } from '@/hooks/useIsClient';
import type { Barber, Booking, BookingStatus } from '@/types';
import { useLocalBookings } from '@/hooks/useLocalBookings';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import {
  formatKz,
  formatDateLong,
  formatDateShort,
  formatLocationType,
  formatPhone,
  toISODate,
  WEEKDAYS,
} from '@/lib/format';

/**
 * Painel do barbeiro (demonstração).
 *
 * Mostra o que um barbeiro parceiro teria: os pedidos que chegam, a agenda do
 * dia e a da semana. Como não há contas, o barbeiro é escolhido num selector.
 */
export function BarberPanel({ barbers }: { barbers: Barber[] }) {
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? '');
  // `null` devolve todas as marcações; filtramos pelo barbeiro aqui.
  const { bookings, loading, updateStatus } = useLocalBookings(null);
  const { showToast } = useToast();

  // A data de hoje só existe no cliente: calculá-la no servidor podia dar outro
  // dia e provocar divergência na hidratação.
  const isClient = useIsClient();
  const today = useMemo(() => (isClient ? toISODate(new Date()) : ''), [isClient]);

  const barber = barbers.find((b) => b.id === barberId);
  const mine = useMemo(
    () => bookings.filter((b) => b.barberId === barberId),
    [bookings, barberId],
  );

  const pending = mine.filter((b) => b.status === 'pendente');

  const todayBookings = useMemo(
    () =>
      mine
        .filter((b) => b.date === today && b.status !== 'cancelada')
        .sort((a, b) => a.time.localeCompare(b.time)),
    [mine, today],
  );

  /** Os próximos sete dias, cada um com as suas marcações. */
  const week = useMemo(() => {
    if (!today) return [];
    const days: { date: string; bookings: Booking[] }[] = [];
    const start = new Date(today);

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const iso = toISODate(day);
      days.push({
        date: iso,
        bookings: mine
          .filter((b) => b.date === iso && b.status !== 'cancelada')
          .sort((a, b) => a.time.localeCompare(b.time)),
      });
    }
    return days;
  }, [mine, today]);

  async function change(booking: Booking, status: BookingStatus, message: string) {
    try {
      await updateStatus(booking.id, status);
      showToast(message);
    } catch {
      showToast('Não foi possível actualizar.', 'error');
    }
  }

  if (loading || !today) {
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />;
  }

  return (
    <div className="space-y-10">
      <div>
        <label htmlFor="barbeiro" className="block text-sm font-semibold text-text">
          Barbeiro
        </label>
        <select
          id="barbeiro"
          value={barberId}
          onChange={(e) => setBarberId(e.target.value)}
          className="mt-1.5 min-h-[48px] w-full max-w-xs rounded-md border border-border bg-surface-2 px-3 text-base text-text"
        >
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* ---- Pedidos por responder ------------------------------------- */}
      <section>
        <h2 className="text-2xl">
          Pedidos por responder
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-pending-tint px-2.5 py-1 align-middle font-sans text-sm font-bold text-pending">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="mt-3 text-text-muted">Nada à espera de resposta.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((booking) => (
              <li key={booking.id} className="rounded-lg border border-pending/40 bg-surface p-4">
                <BookingSummary booking={booking} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => change(booking, 'confirmada', 'Marcação confirmada.')}
                  >
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => change(booking, 'cancelada', 'Pedido recusado.')}
                  >
                    Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Agenda de hoje --------------------------------------------- */}
      <section>
        <h2 className="text-2xl">Hoje</h2>
        <p className="mt-1 text-sm text-text-muted">{formatDateLong(today)}</p>

        {todayBookings.length === 0 ? (
          <p className="mt-3 text-text-muted">
            Sem marcações para hoje
            {barber && barber.schedule[new Date(today).getDay() as 0].length === 0
              ? ' — é dia de folga.'
              : '.'}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {todayBookings.map((booking) => (
              <li key={booking.id} className="rounded-lg border border-border bg-surface p-4">
                <BookingSummary booking={booking} />
                {booking.status === 'confirmada' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-4"
                    onClick={() => change(booking, 'concluida', 'Marcação concluída.')}
                  >
                    Marcar como concluída
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Semana ------------------------------------------------------ */}
      <section>
        <h2 className="text-2xl">Próximos sete dias</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {week.map(({ date, bookings: dayBookings }) => {
            const weekDay = new Date(date).getDay() as 0;
            const isOff = barber ? (barber.schedule[weekDay]?.length ?? 0) === 0 : false;

            return (
              <li key={date} className="rounded-lg border border-border bg-surface p-4">
                <p className="font-semibold capitalize text-text">
                  {WEEKDAYS[weekDay]}
                </p>
                <p className="text-xs text-text-muted">{formatDateShort(date)}</p>

                {isOff ? (
                  <p className="mt-3 text-sm text-text-muted">Folga</p>
                ) : dayBookings.length === 0 ? (
                  <p className="mt-3 text-sm text-text-muted">Livre</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {dayBookings.map((booking) => (
                      <li key={booking.id} className="flex items-baseline gap-2 text-sm">
                        <span className="tabular font-semibold text-primary">
                          {booking.time}
                        </span>
                        <span className="truncate text-text-muted">
                          {booking.clientName}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function BookingSummary({ booking }: { booking: Booking }) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-text">{booking.clientName}</p>
          <a
            href={`tel:${booking.clientPhone}`}
            className="tabular text-sm text-primary underline-offset-4 hover:underline"
          >
            {formatPhone(booking.clientPhone)}
          </a>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-text-muted">Serviço</dt>
          <dd className="text-text">{booking.serviceName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-text-muted">Quando</dt>
          <dd className="tabular text-text">
            {formatDateShort(booking.date)} às {booking.time}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-text-muted">Onde</dt>
          <dd className="text-text">{formatLocationType(booking.locationType)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-text-muted">Valor</dt>
          <dd className="tabular font-semibold text-primary">{formatKz(booking.price)}</dd>
        </div>
      </dl>

      {booking.address && (
        <p className="mt-2 text-sm text-text-muted">
          <span className="font-medium text-text">Morada:</span> {booking.address}
        </p>
      )}
      {booking.notes && (
        <p className="mt-1 text-sm text-text-muted">
          <span className="font-medium text-text">Nota:</span> {booking.notes}
        </p>
      )}
    </>
  );
}
