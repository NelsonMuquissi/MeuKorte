'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIsClient } from '@/hooks/useIsClient';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import type { Barber, LocationType, Service, TimeSlot, Booking } from '@/types';
import { getAvailableSlots, createBooking, calculatePrice } from '@/services/bookingsService';
import { bookingWhatsappLink } from '@/lib/whatsapp';
import {
  formatKz,
  formatDuration,
  formatDateShort,
  formatDateLong,
  toISODate,
  isValidPhone,
  formatLocationType,
} from '@/lib/format';
import { PRICING, BOOKING_WINDOW_DAYS, PAYMENT } from '@/config/business';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/**
 * Fluxo de marcação.
 *
 * Quatro passos num só ecrã, que vão abrindo à medida que o anterior é
 * preenchido. No telemóvel isto funciona melhor do que páginas separadas: o
 * cliente vê sempre o que já escolheu e pode voltar atrás sem perder nada.
 *
 * É cliente de cima a baixo porque todo o ecrã reage a escolhas. A lista de
 * barbeiros vem pré-carregada do servidor, por isso o primeiro render já tem
 * conteúdo.
 */

type Step = 'barbeiro' | 'servico' | 'horario' | 'dados' | 'feito';

export function BookingFlow({ barbers }: { barbers: Barber[] }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // `?barbeiro=id` vem dos cards e do perfil. Aceita id ou slug.
  const preselected = searchParams.get('barbeiro');
  const initialBarber = useMemo(
    () => barbers.find((b) => b.id === preselected || b.slug === preselected) ?? null,
    [barbers, preselected],
  );

  const [barber, setBarber] = useState<Barber | null>(initialBarber);
  const [service, setService] = useState<Service | null>(null);
  const [locationType, setLocationType] = useState<LocationType | null>(null);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  /**
   * Os próximos dias disponíveis para marcar.
   *
   * Só é calculado no cliente: `new Date()` durante o render do servidor daria
   * uma data e no navegador podia dar outra, e o React acusava divergência na
   * hidratação.
   */
  const isClient = useIsClient();
  const days = useMemo(() => {
    if (!isClient) return [];
    const today = new Date();
    const list: string[] = [];
    for (let i = 0; i < Math.min(BOOKING_WINDOW_DAYS, 14); i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      list.push(toISODate(day));
    }
    return list;
  }, [isClient]);

  // Quando muda o barbeiro, o que estava escolhido a seguir deixa de fazer
  // sentido. Ajustado durante o render — o padrão do React para reagir a uma
  // mudança de valor sem passar por um render intermédio inconsistente.
  const [lastBarberId, setLastBarberId] = useState(barber?.id ?? null);
  if (lastBarberId !== (barber?.id ?? null)) {
    setLastBarberId(barber?.id ?? null);
    setService(null);
    setTime('');
    setLocationType(
      barber?.locationTypes.length === 1 ? barber.locationTypes[0] : null,
    );
  }

  // Um serviço mais longo, ou outro dia, pode já não caber na hora escolhida.
  const selectionKey = `${service?.id ?? ''}|${date}`;
  const [lastSelectionKey, setLastSelectionKey] = useState(selectionKey);
  if (lastSelectionKey !== selectionKey) {
    setLastSelectionKey(selectionKey);
    setTime('');
  }

  // Assim que a combinação barbeiro/serviço/dia muda, a grelha antiga deixa de
  // valer: limpa-se já no render para não se mostrarem horas de outro dia
  // enquanto as novas não chegam.
  const slotsKey = `${barber?.id ?? ''}|${service?.id ?? ''}|${date}`;
  const [loadedSlotsKey, setLoadedSlotsKey] = useState(slotsKey);
  if (loadedSlotsKey !== slotsKey) {
    setLoadedSlotsKey(slotsKey);
    setSlots([]);
    setLoadingSlots(Boolean(barber && service && date));
  }

  // Vai buscar os horários livres sempre que há barbeiro, serviço e dia.
  useEffect(() => {
    if (!barber || !service || !date) return;

    let active = true;

    void getAvailableSlots(barber.id, service.id, date).then((result) => {
      if (active) {
        setSlots(result);
        setLoadingSlots(false);
      }
    });

    return () => {
      active = false;
    };
  }, [barber, service, date]);

  const total = service
    ? calculatePrice(service.price, locationType ?? 'salao')
    : 0;

  const step: Step = confirmed
    ? 'feito'
    : !barber
      ? 'barbeiro'
      : !service || !locationType
        ? 'servico'
        : !time
          ? 'horario'
          : 'dados';

  const canSubmit =
    barber !== null &&
    service !== null &&
    locationType !== null &&
    date !== '' &&
    time !== '' &&
    name.trim().length >= 2 &&
    isValidPhone(phone) &&
    (locationType !== 'domicilio' || address.trim().length >= 5) &&
    !submitting;

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!barber || !service || !locationType || !canSubmit) return;

      setSubmitting(true);
      try {
        const booking = await createBooking({
          barberId: barber.id,
          barberName: barber.name,
          serviceId: service.id,
          serviceName: service.name,
          price: total,
          durationMinutes: service.durationMinutes,
          date,
          time,
          locationType,
          address: locationType === 'domicilio' ? address.trim() : undefined,
          clientName: name.trim(),
          clientPhone: phone,
          notes: notes.trim() || undefined,
        });

        // Guarda o telemóvel para que "As minhas marcações" abra já com a lista,
        // sem obrigar o cliente a escrever outra vez o número que acabou de dar.
        try {
          window.localStorage.setItem('meukorte:last-phone', booking.clientPhone);
        } catch {
          /* armazenamento indisponível — a página pede o número na mesma */
        }

        setConfirmed(booking);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Não foi possível marcar.',
          'error',
        );
        // O horário pode ter sido ocupado entretanto — volta a ler a grelha.
        if (barber && service && date) {
          const fresh = await getAvailableSlots(barber.id, service.id, date);
          setSlots(fresh);
          setTime('');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [barber, service, locationType, canSubmit, total, date, time, address, name, phone, notes, showToast],
  );

  /* ---- Ecrã final ------------------------------------------------------ */
  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-confirmed-tint text-confirmed">
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="mt-5 text-3xl">Marcação registada</h2>
        <p className="mt-3 text-text-muted">
          Falta só confirmar pelo WhatsApp. Carrega no botão abaixo — a mensagem
          já vai escrita.
        </p>

        <dl className="mt-6 space-y-2 rounded-lg border border-border bg-surface p-5 text-left text-sm">
          <Row label="Barbeiro" value={confirmed.barberName} />
          <Row label="Serviço" value={confirmed.serviceName} />
          <Row label="Dia" value={formatDateLong(confirmed.date)} />
          <Row label="Hora" value={confirmed.time} />
          <Row label="Onde" value={formatLocationType(confirmed.locationType)} />
          {confirmed.address && <Row label="Morada" value={confirmed.address} />}
          <Row label="Total" value={formatKz(confirmed.price)} emphasis />
        </dl>

        <a
          href={bookingWhatsappLink(confirmed)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 text-lg font-bold text-black transition-transform hover:scale-[1.02]"
        >
          Confirmar pelo WhatsApp
        </a>

        <ButtonLink href="/minhas-marcacoes" variant="secondary" className="mt-3 w-full">
          Ver as minhas marcações
        </ButtonLink>

        <p className="mt-4 text-xs text-text-muted">
          {PAYMENT.moment === 'on_service'
            ? 'Pagas no fim do serviço, directamente ao barbeiro.'
            : 'O pagamento é feito no momento da marcação.'}
        </p>
      </div>
    );
  }

  /* ---- Fluxo ----------------------------------------------------------- */
  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        {/* Passo 1 — barbeiro */}
        <Section number={1} title="Escolhe o barbeiro" done={barber !== null}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {barbers.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setBarber(b)}
                  aria-pressed={barber?.id === b.id}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    barber?.id === b.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface hover:border-primary-dim'
                  }`}
                >
                  <Image
                    src={b.photo}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text">{b.name}</span>
                    <span className="block truncate text-sm text-text-muted">
                      {b.area} · {b.specialties[0]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        {/* Passo 2 — serviço e local */}
        {barber && (
          <Section number={2} title="Escolhe o serviço" done={service !== null && locationType !== null}>
            <ul className="space-y-2">
              {barber.services.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setService(s)}
                    aria-pressed={service?.id === s.id}
                    className={`flex w-full items-baseline justify-between gap-4 rounded-lg border p-4 text-left transition-colors ${
                      service?.id === s.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface hover:border-primary-dim'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-text">{s.name}</span>
                      <span className="tabular block text-sm text-text-muted">
                        {formatDuration(s.durationMinutes)}
                      </span>
                    </span>
                    <span className="tabular shrink-0 font-semibold text-primary">
                      {formatKz(s.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {barber.locationTypes.length > 1 && (
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold text-text">Onde queres ser atendido?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {barber.locationTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLocationType(type)}
                      aria-pressed={locationType === type}
                      className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${
                        locationType === type
                          ? 'border-primary bg-primary text-primary-ink'
                          : 'border-border bg-surface text-text-muted hover:border-primary-dim'
                      }`}
                    >
                      {formatLocationType(type)}
                      {type === 'domicilio' && ` (+${formatKz(PRICING.homeServiceFee)})`}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </Section>
        )}

        {/* Passo 3 — dia e hora */}
        {barber && service && locationType && (
          <Section number={3} title="Escolhe o dia e a hora" done={time !== ''}>
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              <div className="flex gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setDate(day)}
                    aria-pressed={date === day}
                    className={`min-h-[56px] shrink-0 rounded-md border px-3 text-sm font-medium transition-colors ${
                      date === day
                        ? 'border-primary bg-primary text-primary-ink'
                        : 'border-border bg-surface text-text-muted hover:border-primary-dim'
                    }`}
                  >
                    {formatDateShort(day)}
                  </button>
                ))}
              </div>
            </div>

            {date && (
              <div className="mt-5" aria-live="polite">
                {loadingSlots ? (
                  <p className="text-sm text-text-muted">A procurar horários…</p>
                ) : slots.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                    {barber.name} não atende neste dia. Escolhe outro.
                  </p>
                ) : slots.every((s) => !s.available) ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                    Já não há horas livres neste dia. Experimenta o dia seguinte.
                  </p>
                ) : (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => (
                      <li key={slot.time}>
                        <button
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setTime(slot.time)}
                          aria-pressed={time === slot.time}
                          aria-label={
                            slot.available
                              ? `${slot.time}, disponível`
                              : `${slot.time}, ${slot.reason === 'ocupado' ? 'ocupado' : 'já passou'}`
                          }
                          className={`tabular min-h-[44px] w-full rounded-md border text-sm font-semibold transition-colors ${
                            time === slot.time
                              ? 'border-primary bg-primary text-primary-ink'
                              : slot.available
                                ? 'border-border bg-surface text-text hover:border-primary-dim'
                                : 'cursor-not-allowed border-border/50 bg-surface/40 text-text-muted/40 line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Section>
        )}

        {/* Passo 4 — dados */}
        {barber && service && locationType && time && (
          <Section number={4} title="Os teus dados" done={false}>
            <div className="space-y-4">
              <Field
                label="Nome"
                id="nome"
                value={name}
                onChange={setName}
                autoComplete="name"
                placeholder="Como te chamas?"
                required
              />
              <Field
                label="Telemóvel"
                id="telemovel"
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
                placeholder="923 456 789"
                hint="É por aqui que o barbeiro te contacta, e é como voltas a encontrar a tua marcação."
                error={phone.length > 0 && !isValidPhone(phone) ? 'Número inválido. Deve ter 9 algarismos e começar por 9.' : undefined}
                required
              />
              {locationType === 'domicilio' && (
                <Field
                  label="Morada"
                  id="morada"
                  value={address}
                  onChange={setAddress}
                  autoComplete="street-address"
                  placeholder="Rua, prédio, andar, ponto de referência"
                  hint="Quanto mais detalhe, mais fácil o barbeiro chegar."
                  required
                />
              )}
              <Field
                label="Observações"
                id="observacoes"
                value={notes}
                onChange={setNotes}
                placeholder="Alguma coisa que o barbeiro deva saber? (opcional)"
                optional
              />
            </div>
          </Section>
        )}
      </div>

      {/* ---- Resumo ------------------------------------------------------ */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-xl">Resumo</h2>

          {step === 'barbeiro' ? (
            <p className="mt-3 text-sm text-text-muted">
              Começa por escolher o barbeiro.
            </p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm">
              {barber && <Row label="Barbeiro" value={barber.name} />}
              {service && <Row label="Serviço" value={service.name} />}
              {service && <Row label="Duração" value={formatDuration(service.durationMinutes)} />}
              {locationType && <Row label="Onde" value={formatLocationType(locationType)} />}
              {date && <Row label="Dia" value={formatDateShort(date)} />}
              {time && <Row label="Hora" value={time} />}

              {service && (
                <>
                  <div className="!mt-4 border-t border-border pt-3">
                    <Row label="Serviço" value={formatKz(service.price)} />
                  </div>
                  {locationType === 'domicilio' && (
                    <Row label="Deslocação" value={formatKz(PRICING.homeServiceFee)} />
                  )}
                  <Row label="Total" value={formatKz(total)} emphasis />
                </>
              )}
            </dl>
          )}

          <Button type="submit" disabled={!canSubmit} className="mt-5 w-full" size="lg">
            {submitting ? 'A marcar…' : 'Confirmar marcação'}
          </Button>

          <p className="mt-3 text-xs text-text-muted">
            {PAYMENT.moment === 'on_service'
              ? 'Não pagas nada agora. O pagamento é feito no fim do serviço.'
              : 'O pagamento é feito no momento da marcação.'}
          </p>
        </div>
      </aside>
    </form>
  );
}

/* ---- Peças internas ----------------------------------------------------- */

function Section({
  number,
  title,
  done,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-3 text-2xl">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold ${
            done ? 'bg-confirmed-tint text-confirmed' : 'bg-primary text-primary-ink'
          }`}
          aria-hidden="true"
        >
          {done ? '✓' : number}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd
        className={`tabular text-right ${
          emphasis ? 'text-base font-bold text-primary' : 'font-medium text-text'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  error,
  required = false,
  optional = false,
  autoComplete,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  autoComplete?: string;
}) {
  const hintId = hint ? `${id}-ajuda` : undefined;
  const errorId = error ? `${id}-erro` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {label}
        {optional && <span className="ml-1 font-normal text-text-muted">(opcional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={`mt-1.5 min-h-[48px] w-full rounded-md border bg-surface-2 px-3 text-base text-text placeholder:text-text-muted/60 ${
          error ? 'border-cancelled' : 'border-border focus:border-primary-dim'
        }`}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-cancelled">
          {error}
        </p>
      )}
    </div>
  );
}
