'use client';

import type { Booking, Review } from '@/types';
import { useIsClient } from '@/hooks/useIsClient';
import { canCancel } from '@/services/bookingsService';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Rating } from '@/components/ui/Rating';
import { bookingWhatsappLink } from '@/lib/whatsapp';
import { formatKz, formatDateLong, formatLocationType } from '@/lib/format';
import { CANCELLATION } from '@/config/business';

/**
 * Um agendamento, em card.
 *
 * Vive à parte porque é usado em dois sítios da área do cliente — na lista
 * completa e no resumo — e porque o botão de cancelar depende da hora actual,
 * o que obriga a `useIsClient`. Deixá-lo dentro da lista obrigava a duplicar
 * essa regra.
 */
export function BookingCard({
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
          <dd className="tabular font-semibold text-emphasis">{formatKz(booking.price)}</dd>
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
            className="inline-flex min-h-[38px] items-center rounded-md border border-border bg-surface-2 px-3 text-sm font-semibold text-text transition-colors hover:border-primary-dim hover:text-emphasis"
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
