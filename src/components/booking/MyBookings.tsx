'use client';

import { useEffect, useMemo, useState } from 'react';
import { useIsClient } from '@/hooks/useIsClient';
import Link from 'next/link';
import type { Booking, Review } from '@/types';
import { useLocalBookings } from '@/hooks/useLocalBookings';
import { canCancel } from '@/services/bookingsService';
import { getReviewByBooking } from '@/services/reviewsService';
import { STORAGE_EVENT } from '@/services/storage';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Rating } from '@/components/ui/Rating';
import { ReviewForm } from './ReviewForm';
import { useToast } from '@/components/ui/Toast';
import {
  formatKz,
  formatDateLong,
  formatLocationType,
  isValidPhone,
  normalizePhone,
  toISODate,
} from '@/lib/format';
import { CANCELLATION } from '@/config/business';
import { bookingWhatsappLink } from '@/lib/whatsapp';

/**
 * Consulta de marcações pelo telemóvel.
 *
 * Enquanto não há contas, o telemóvel é a identificação: é o que liga uma
 * marcação ao cliente que a fez. Na fase Django isto passa a ser uma sessão
 * autenticada e o passo de introduzir o número desaparece.
 */
export function MyBookings() {
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const isClient = useIsClient();

  /**
   * Recorda o último número usado neste dispositivo, para não ter de o escrever
   * sempre. Só existe no cliente, por isso é lido através do `useIsClient` em
   * vez de um `useEffect` com `setState`.
   */
  const savedPhone = useMemo(() => {
    if (!isClient) return null;
    try {
      return window.localStorage.getItem('meukorte:last-phone');
    } catch {
      return null; // armazenamento indisponível — segue sem recordar
    }
  }, [isClient]);

  // `undefined` quer dizer "o utilizador ainda não mexeu": nesse caso vale o que
  // estava guardado. Evita ter de copiar o valor guardado para dentro do estado.
  const [inputOverride, setInput] = useState<string | undefined>(undefined);
  const [phoneOverride, setPhone] = useState<string | null | undefined>(undefined);

  const input = inputOverride ?? savedPhone ?? '';
  const phone = phoneOverride === undefined ? savedPhone : phoneOverride;

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizePhone(input);
    if (!normalized) return;
    setPhone(normalized);
    try {
      window.localStorage.setItem('meukorte:last-phone', normalized);
    } catch {
      /* segue na mesma */
    }
  }

  if (!phone) {
    return (
      <form onSubmit={handleSearch} className="mx-auto max-w-md">
        <label htmlFor="telemovel-consulta" className="block text-sm font-semibold text-text">
          O teu telemóvel
        </label>
        <p id="telemovel-ajuda" className="mt-1 text-sm text-text-muted">
          O mesmo número que usaste para marcar.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            id="telemovel-consulta"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-describedby="telemovel-ajuda"
            placeholder="923 456 789"
            className="min-h-[48px] flex-1 rounded-md border border-border bg-surface-2 px-3 text-base text-text placeholder:text-text-muted/60 focus:border-primary-dim"
          />
          <Button type="submit" disabled={!isValidPhone(input)}>
            Ver
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <BookingsList
        phone={phone}
        onChangePhone={() => setPhone(null)}
        onReview={setReviewing}
      />
      {reviewing && (
        <ReviewForm
          booking={reviewing}
          open
          onClose={() => setReviewing(null)}
          onDone={() => setReviewing(null)}
        />
      )}
    </>
  );
}

function BookingsList({
  phone,
  onChangePhone,
  onReview,
}: {
  phone: string;
  onChangePhone: () => void;
  onReview: (booking: Booking) => void;
}) {
  const { bookings, loading, error, cancelBooking } = useLocalBookings(phone);
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Record<string, Review>>({});

  // As avaliações já feitas, para saber quais marcações ainda têm botão "Avaliar".
  useEffect(() => {
    let active = true;

    async function loadReviews() {
      const entries = await Promise.all(
        bookings.map(async (b) => [b.id, await getReviewByBooking(b.id)] as const),
      );
      if (!active) return;
      const map: Record<string, Review> = {};
      for (const [id, review] of entries) if (review) map[id] = review;
      setReviews(map);
    }

    void loadReviews();
    const onChange = () => void loadReviews();
    window.addEventListener(STORAGE_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(STORAGE_EVENT, onChange);
    };
  }, [bookings]);

  // Divide entre o que está para vir e o que já passou.
  const { upcoming, past } = useMemo(() => {
    const today = toISODate(new Date());
    const up: Booking[] = [];
    const old: Booking[] = [];

    for (const booking of bookings) {
      const isFuture = booking.date >= today;
      if (isFuture && booking.status !== 'cancelada' && booking.status !== 'concluida') {
        up.push(booking);
      } else {
        old.push(booking);
      }
    }

    // As próximas por ordem crescente; o histórico, da mais recente para trás.
    up.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    return { upcoming: up, past: old };
  }, [bookings]);

  async function handleCancel(booking: Booking) {
    const confirmed = window.confirm(
      `Cancelar a marcação de ${booking.serviceName} com ${booking.barberName}?`,
    );
    if (!confirmed) return;

    try {
      await cancelBooking(booking.id);
      showToast('Marcação cancelada.');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível cancelar.',
        'error',
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="A carregar marcações">
        {[0, 1].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-cancelled/40 bg-cancelled-tint p-4 text-sm text-cancelled">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          Marcações de <span className="tabular font-semibold text-text">{phone}</span>
        </p>
        <button
          type="button"
          onClick={onChangePhone}
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Usar outro número
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-lg text-text">Ainda não tens marcações.</p>
          <p className="mt-2 text-text-muted">
            Se marcaste noutro telemóvel ou noutro navegador, as marcações ficaram lá.
          </p>
          <ButtonLink href="/marcar" className="mt-6">
            Marcar corte
          </ButtonLink>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-2xl">Próximas</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-text-muted">
                Nenhuma marcação à frente.{' '}
                <Link href="/marcar" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Marcar outra
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcoming.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    review={reviews[booking.id]}
                    onCancel={() => handleCancel(booking)}
                    onReview={() => onReview(booking)}
                  />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-2xl">Anteriores</h2>
              <ul className="mt-4 space-y-3">
                {past.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    review={reviews[booking.id]}
                    onCancel={() => handleCancel(booking)}
                    onReview={() => onReview(booking)}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  review,
  onCancel,
  onReview,
}: {
  booking: Booking;
  review?: Review;
  onCancel: () => void;
  onReview: () => void;
}) {
  // `canCancel` depende da hora actual, por isso só pode ser avaliado no
  // cliente — senão o HTML do servidor e o do cliente divergiam.
  const isClient = useIsClient();
  const cancellable = isClient && canCancel(booking);

  const needsReview = booking.status === 'concluida' && !review;

  return (
    <li className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-lg font-semibold normal-case tracking-normal text-text">
            {booking.serviceName}
          </h3>
          <p className="text-sm text-text-muted">com {booking.barberName}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
          <dt className="text-text-muted">Dia</dt>
          <dd className="text-text">{formatDateLong(booking.date)}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
          <dt className="text-text-muted">Hora</dt>
          <dd className="tabular text-text">{booking.time}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
          <dt className="text-text-muted">Onde</dt>
          <dd className="text-text">{formatLocationType(booking.locationType)}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:justify-start sm:gap-2">
          <dt className="text-text-muted">Total</dt>
          <dd className="tabular font-semibold text-primary">{formatKz(booking.price)}</dd>
        </div>
      </dl>

      {review && (
        <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">A tua avaliação:</span>
            <Rating value={review.rating} />
          </div>
          {review.comment && (
            <p className="mt-1.5 text-sm text-text-muted">{review.comment}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {needsReview && (
          <Button size="sm" onClick={onReview}>
            Avaliar
          </Button>
        )}

        {booking.status === 'pendente' && (
          <a
            href={bookingWhatsappLink(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center rounded-md border border-border bg-surface-2 px-3 text-sm font-semibold text-text transition-colors hover:border-primary-dim hover:text-primary"
          >
            Reenviar pelo WhatsApp
          </a>
        )}

        {cancellable && (
          <Button size="sm" variant="danger" onClick={onCancel}>
            Cancelar
          </Button>
        )}

        {!cancellable &&
          booking.status !== 'cancelada' &&
          booking.status !== 'concluida' && (
            <p className="self-center text-xs text-text-muted">
              Já não dá para cancelar aqui ({CANCELLATION.minHoursBefore}h de
              antecedência). Fala connosco pelo WhatsApp.
            </p>
          )}
      </div>
    </li>
  );
}
