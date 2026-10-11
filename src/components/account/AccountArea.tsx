'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Barber, Booking, Review } from '@/types';
import { useIsClient } from '@/hooks/useIsClient';
import { useLocalBookings } from '@/hooks/useLocalBookings';
import { getReviewByBooking } from '@/services/reviewsService';
import { STORAGE_EVENT } from '@/services/storage';
import { getLastPhone, getLastName, setLastPhone, signOut } from '@/services/profileService';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { BookingCard } from '@/components/booking/BookingCard';
import { ReviewForm } from '@/components/booking/ReviewForm';
import { normalizePhone, toISODate } from '@/lib/format';
import { AccountNav, type AccountSection } from './AccountNav';
import { AccountSummary } from './AccountSummary';
import { AccountProfile } from './AccountProfile';

/**
 * Área do cliente — o ecrã 9 do template.
 *
 * Enquanto não há contas no Django, o telemóvel é a identificação: é ele que
 * liga um agendamento a quem o fez. Por isso a área começa por pedir o número,
 * e só o pede quando não há nenhum guardado neste dispositivo. Na fase Django
 * este passo desaparece e dá lugar a uma sessão autenticada.
 *
 * As secções são estado, não rotas: a página tem de continuar estática no
 * `next build`, e um `/conta/dados` obrigaria a uma rota por secção sem nada
 * que o justifique — não há nada para ligar de fora, nem para indexar.
 */
export function AccountArea({ barbers }: { barbers: Barber[] }) {
  const isClient = useIsClient();

  /**
   * `undefined` quer dizer "o cliente ainda não mexeu": nesse caso vale o que
   * estava guardado. Evita copiar o valor guardado para dentro do estado, que
   * obrigaria a um efeito com `setState`.
   */
  const savedPhone = useMemo(() => (isClient ? getLastPhone() : null), [isClient]);
  const savedName = useMemo(() => (isClient ? getLastName() : null), [isClient]);
  const [phoneOverride, setPhone] = useState<string | null | undefined>(undefined);
  const phone = phoneOverride === undefined ? savedPhone : phoneOverride;

  const [section, setSection] = useState<AccountSection>('resumo');

  const handleSignOut = useCallback(() => {
    signOut();
    setPhone(null);
    setSection('resumo');
  }, []);

  if (!phone) {
    return <PhoneGate initial={savedPhone ?? ''} onFound={setPhone} />;
  }

  return (
    <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
      <AccountNav active={section} onChange={setSection} onSignOut={handleSignOut} />

      <div className="mt-6 lg:mt-0">
        <Sections
          section={section}
          phone={phone}
          name={savedName}
          barbers={barbers}
          onSection={setSection}
          onChangePhone={() => setPhone(null)}
        />
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Dados + secções                                                            */
/* ========================================================================== */

/**
 * Carrega os agendamentos uma vez e distribui-os pelas secções.
 *
 * Está separado do `AccountArea` porque o `useLocalBookings` precisa de um
 * telemóvel já conhecido — no componente de cima ele ainda pode ser `null`, e
 * um hook não pode ficar atrás de um `return`.
 */
function Sections({
  section,
  phone,
  name,
  barbers,
  onSection,
  onChangePhone,
}: {
  section: AccountSection;
  phone: string;
  name: string | null;
  barbers: Barber[];
  onSection: (section: AccountSection) => void;
  onChangePhone: () => void;
}) {
  const { bookings, loading, error, cancelBooking } = useLocalBookings(phone);
  const { showToast } = useToast();
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [reviews, setReviews] = useState<Record<string, Review>>({});

  // As avaliações já feitas, para saber o que ainda tem botão "Avaliar" e para
  // a média do resumo.
  useEffect(() => {
    let active = true;

    async function load() {
      const entries = await Promise.all(
        bookings.map(async (b) => [b.id, await getReviewByBooking(b.id)] as const),
      );
      if (!active) return;
      const map: Record<string, Review> = {};
      for (const [id, review] of entries) if (review) map[id] = review;
      setReviews(map);
    }

    void load();
    const onChange = () => void load();
    window.addEventListener(STORAGE_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(STORAGE_EVENT, onChange);
    };
  }, [bookings]);

  // O que está para vir e o que já passou.
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

    up.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    old.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    return { upcoming: up, past: old };
  }, [bookings]);

  const handleCancel = useCallback(
    async (booking: Booking) => {
      const ok = window.confirm(
        `Cancelar o agendamento de ${booking.serviceName} com ${booking.barberName}?`,
      );
      if (!ok) return;
      try {
        await cancelBooking(booking.id);
        showToast('Agendamento cancelado.');
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Não foi possível cancelar.',
          'error',
        );
      }
    },
    [cancelBooking, showToast],
  );

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="A carregar agendamentos">
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
    <>
      {section === 'resumo' && (
        <AccountSummary
          name={name}
          bookings={bookings}
          reviews={reviews}
          barbers={barbers}
          upcoming={upcoming}
          past={past}
          onSeeAll={() => onSection('agendamentos')}
        />
      )}

      {section === 'agendamentos' && (
        <div className="space-y-10">
          <header>
            <h2 className="text-2xl sm:text-3xl">Os meus agendamentos</h2>
            <p className="mt-1.5 text-text-muted">
              O que está para vir e o que já passou.
            </p>
          </header>

          {bookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
              <p className="text-lg text-text">Ainda não tens agendamentos.</p>
              <p className="mt-2 text-text-muted">
                Se agendaste noutro telemóvel ou noutro navegador, os agendamentos
                ficaram lá.
              </p>
              <ButtonLink href="/agendar" className="mt-6">
                Agendar agora
              </ButtonLink>
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-xl">Próximas</h3>
                {upcoming.length === 0 ? (
                  <p className="mt-3 text-text-muted">
                    Nenhum agendamento à frente.{' '}
                    <Link
                      href="/agendar"
                      className="font-semibold text-emphasis underline-offset-4 hover:underline"
                    >
                      Agendar outro
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
                        onReview={() => setReviewing(booking)}
                      />
                    ))}
                  </ul>
                )}
              </section>

              {past.length > 0 && (
                <section>
                  <h3 className="text-xl">Anteriores</h3>
                  <ul className="mt-4 space-y-3">
                    {past.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        review={reviews[booking.id]}
                        onCancel={() => handleCancel(booking)}
                        onReview={() => setReviewing(booking)}
                      />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {section === 'dados' && (
        <AccountProfile name={name} phone={phone} onChangePhone={onChangePhone} />
      )}

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

/* ========================================================================== */
/* Entrada pelo telemóvel                                                     */
/* ========================================================================== */

function PhoneGate({
  initial,
  onFound,
}: {
  initial: string;
  onFound: (phone: string) => void;
}) {
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizePhone(input);
    if (!normalized) {
      setError('Número inválido. Deve ter 9 algarismos e começar por 9.');
      return;
    }
    setLastPhone(normalized);
    onFound(normalized);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
      <label htmlFor="telemovel-consulta" className="block text-sm font-bold text-text">
        O teu telemóvel
      </label>
      <p id="telemovel-ajuda" className="mt-1 text-sm text-text-muted">
        O mesmo número que usaste para agendar.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          id="telemovel-consulta"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          aria-describedby="telemovel-ajuda"
          aria-invalid={error ? true : undefined}
          placeholder="923 456 789"
          className={`min-h-[48px] flex-1 rounded-md border bg-surface px-3 text-base text-text placeholder:text-text-muted/60 ${
            error ? 'border-cancelled' : 'border-border focus:border-primary-dim'
          }`}
        />
        <Button type="submit">Ver</Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-cancelled">
          {error}
        </p>
      )}
    </form>
  );
}
