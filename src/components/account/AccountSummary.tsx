'use client';

import Image from 'next/image';
import type { Barber, Booking, Review } from '@/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CalendarClock, Clock, Star, MapPin } from '@/components/ui/Icons';
import { averageRating } from '@/services/reviewsService';
import { formatDateLong, formatDate, formatLocationType } from '@/lib/format';

/**
 * O "Início" da área do cliente — o ecrã 9 do template.
 *
 * Três números, o próximo agendamento e o histórico. Tudo sai dos agendamentos
 * e das avaliações que existem mesmo neste dispositivo; nada aqui é inventado.
 *
 * O template mostra um terceiro cartão com "1 Assinatura activa". Não está aqui
 * porque não há assinaturas: os planos em `business.ts` são provisórios e não
 * existe forma de subscrever nem onde guardar uma subscrição. Um número que
 * finge uma assinatura que o cliente não tem é uma mentira, e das caras — ele
 * ia perguntar porque está a pagar. No lugar dele vai quantos agendamentos tem
 * à frente, que é verdade e é útil.
 */
export function AccountSummary({
  name,
  bookings,
  reviews,
  barbers,
  upcoming,
  past,
  onSeeAll,
}: {
  name: string | null;
  bookings: Booking[];
  reviews: Record<string, Review>;
  barbers: Barber[];
  upcoming: Booking[];
  past: Booking[];
  onSeeAll: () => void;
}) {
  const done = bookings.filter((b) => b.status === 'concluida').length;
  const given = Object.values(reviews);
  const average = averageRating(given);

  const next = upcoming[0] ?? null;
  const photoOf = (barberId: string) =>
    barbers.find((b) => b.id === barberId)?.photo ?? null;

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-2xl sm:text-3xl">
          {name ? `Olá, ${firstName(name)}!` : 'Olá!'}
        </h2>
        <p className="mt-1.5 text-text-muted">
          Bem-vindo de volta. Aqui tens o teu resumo.
        </p>
      </header>

      {/* ---- Os três números ------------------------------------------- */}
      <ul className="grid gap-3 sm:grid-cols-3">
        <Stat Icon={CalendarClock} value={String(done)} label="Agendamentos realizados" />
        <Stat Icon={Clock} value={String(upcoming.length)} label="Por vir" />
        <Stat
          Icon={Star}
          value={average !== null ? average.toFixed(1).replace('.', ',') : '—'}
          label={
            given.length === 0
              ? 'Ainda não avaliaste'
              : `Média das tuas ${given.length === 1 ? 'avaliação' : 'avaliações'}`
          }
        />
      </ul>

      {/* ---- Próximo agendamento ---------------------------------------- */}
      <section>
        <h3 className="text-xl">Próximo agendamento</h3>

        {!next ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-surface p-8 text-center">
            <p className="text-text">Não tens nada marcado.</p>
            <ButtonLink href="/agendar" className="mt-5">
              Agendar agora
            </ButtonLink>
          </div>
        ) : (
          <article className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
            <div className="flex gap-4">
              {photoOf(next.barberId) && (
                <Image
                  src={photoOf(next.barberId)!}
                  alt=""
                  width={80}
                  height={80}
                  className="size-20 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold text-text">{describe(next)}</p>
                  <StatusBadge status={next.status} />
                </div>
                <p className="text-sm text-text-muted">{next.barberName}</p>

                <p className="mt-2.5 flex items-start gap-2 text-sm text-text">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary-dim" />
                  {formatDateLong(next.date)} · {next.time}
                </p>
                <p className="mt-1 flex items-start gap-2 text-sm text-text">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary-dim" />
                  {next.address ?? formatLocationType(next.locationType)}
                </p>
              </div>
            </div>

            <Button variant="secondary" onClick={onSeeAll} className="mt-4 w-full">
              Ver detalhes
            </Button>
          </article>
        )}
      </section>

      {/* ---- Histórico --------------------------------------------------- */}
      {past.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl">Histórico de agendamentos</h3>
            {past.length > 3 && (
              <button
                type="button"
                onClick={onSeeAll}
                className="text-sm font-semibold text-emphasis underline-offset-4 hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>

          <ul className="mt-4 space-y-2">
            {past.slice(0, 3).map((booking) => (
              <li
                key={booking.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                {photoOf(booking.barberId) && (
                  <Image
                    src={photoOf(booking.barberId)!}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                )}
                {/* Sem `truncate`: a 360px o estilo é a parte que ficava de
                    fora, e é justamente o que distingue um corte do outro. */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text">{describe(booking)}</p>
                  <p className="truncate text-sm text-text-muted">{booking.barberName}</p>
                  <p className="text-xs text-text-muted">{formatDate(booking.date)}</p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={booking.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Um dos três cartões: ícone num chip, o número grande, a legenda por baixo. */
function Stat({
  Icon,
  value,
  label,
}: {
  Icon: (props: { className?: string }) => React.ReactElement;
  value: string;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary-dim"
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="tabular block text-2xl font-extrabold leading-tight text-text">
          {value}
        </span>
        <span className="block text-sm text-text-muted">{label}</span>
      </span>
    </li>
  );
}

/** "Corte + barba · Degradê + Barba curta" — o serviço com os estilos. */
function describe(booking: Booking): string {
  const styles = [booking.styleName, booking.beardStyleName].filter(Boolean);
  return styles.length > 0 ? `${booking.serviceName} · ${styles.join(' + ')}` : booking.serviceName;
}

/** "José Pensado" → "José". */
function firstName(name: string): string {
  return name.split(' ')[0];
}
