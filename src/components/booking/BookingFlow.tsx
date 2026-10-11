'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useIsClient } from '@/hooks/useIsClient';
import type {
  Barber,
  Booking,
  LocationType,
  Service,
  ServiceType,
  Style,
  TimeSlot,
} from '@/types';
import { haircutStyles, beardStyles, getStyleById } from '@/data/styles';
import { getAvailableSlots, createBooking, calculatePrice } from '@/services/bookingsService';
import {
  ADDRESS_SLOTS,
  getSavedAddress,
  getLastName,
  getLastPhone,
  saveAddress,
  setLastName,
  setLastPhone,
} from '@/services/profileService';
import { bookingWhatsappLink } from '@/lib/whatsapp';
import {
  formatKz,
  formatDuration,
  formatDateLong,
  toISODate,
  parseDate,
  isValidPhone,
  formatLocationType,
} from '@/lib/format';
import {
  BOOKABLE_SERVICES,
  BOOKING_WINDOW_DAYS,
  PRICING,
  PAYMENT,
  PILOT_AREA,
  paymentClaim,
} from '@/config/business';
import { Button, ButtonLink, ArrowRight } from '@/components/ui/Button';
import { Stepper, STEPS, type StepIndex } from './Stepper';
import { SelectableCard, SelectionMark } from './SelectableCard';
import { Calendar } from './Calendar';
import { Rating } from '@/components/ui/Rating';
import { HeadCut, HeadBeard, Check, MapPin, HomePin } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

/**
 * Fluxo de agendamento — os seis passos do template, um ecrã de cada vez.
 *
 *   Serviço → Estilo → Barbeiro → Agendamento → Localização → Confirmação
 *
 * Um passo por ecrã, e não tudo numa página: no telemóvel, que é onde a maioria
 * vai estar, uma página com seis secções abertas obriga a rolar às cegas e
 * esconde o que falta decidir. Com um passo de cada vez há sempre uma só
 * pergunta à vista, e o `Stepper` mostra onde se está.
 *
 * A ordem é a do template e não é arbitrária: o serviço escolhe-se antes do
 * barbeiro, por isso o tipo de serviço (`ServiceType`) existe ao nível da
 * plataforma, em `BOOKABLE_SERVICES`, e só no passo 3 — quando já há barbeiro —
 * é que se encontra o `Service` concreto, com o preço e a duração reais desse
 * profissional. Daí "Desde X Kz" no primeiro passo.
 *
 * Nenhum preço, taxa ou regra está escrito aqui: vêm todos de `business.ts`.
 */

/** Um passo do fluxo. A ordem é a de `STEPS`, no `Stepper`. */
const LAST_STEP = (STEPS.length - 1) as StepIndex;

export function BookingFlow({ barbers }: { barbers: Barber[] }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isClient = useIsClient();

  /* ---- Escolhas --------------------------------------------------------- */
  const [step, setStep] = useState<StepIndex>(0);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [beardStyleId, setBeardStyleId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationType, setLocationType] = useState<LocationType | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  /** Só se mostram erros depois de o cliente tentar avançar. */
  const [showErrors, setShowErrors] = useState(false);

  /* ---- Valores derivados ------------------------------------------------ */
  const bookable = BOOKABLE_SERVICES.find((s) => s.type === serviceType) ?? null;
  const needsBeardStyle = bookable?.includesBeard ?? false;

  /** Só entram barbeiros que prestem mesmo o serviço escolhido. */
  const eligibleBarbers = useMemo(
    () => (serviceType ? barbers.filter((b) => b.services.some((s) => s.type === serviceType)) : barbers),
    [barbers, serviceType],
  );

  const barber = eligibleBarbers.find((b) => b.id === barberId) ?? null;

  /** O serviço concreto: é aqui que o preço deixa de ser "desde" e passa a ser o real. */
  const service: Service | null =
    barber && serviceType ? barber.services.find((s) => s.type === serviceType) ?? null : null;

  const total = service ? calculatePrice(service.price, locationType ?? 'salao') : 0;

  /* ---- Recuperação do que já se sabe do cliente ------------------------- */
  /**
   * O telemóvel do último agendamento, para não o escrever outra vez.
   *
   * Só existe no cliente, por isso passa pelo `useIsClient` em vez de um efeito
   * com `setState` — é o padrão usado no resto da aplicação. O `undefined`
   * quer dizer "ainda não foi tocado": nesse caso vale o número guardado, e
   * assim não é preciso copiar o valor guardado para dentro do estado.
   */
  const savedPhone = useMemo(() => (isClient ? getLastPhone() : null), [isClient]);
  const [phoneOverride, setPhone] = useState<string | undefined>(undefined);
  const phone = phoneOverride ?? savedPhone ?? '';

  const savedName = useMemo(() => (isClient ? getLastName() : null), [isClient]);
  const [nameOverride, setName] = useState<string | undefined>(undefined);
  const name = nameOverride ?? savedName ?? '';

  /* ---- Barbeiro vindo de `?barbeiro=` ----------------------------------- */
  // Vem dos cards e do perfil. Fica pré-escolhido, mas o passo 3 aparece na
  // mesma: quem chegou pelo perfil de um barbeiro pode na mesma mudar de ideias.
  const preselected = searchParams.get('barbeiro');
  const [appliedPreselection, setAppliedPreselection] = useState(false);
  if (!appliedPreselection && preselected) {
    setAppliedPreselection(true);
    const match = barbers.find((b) => b.id === preselected || b.slug === preselected);
    if (match) setBarberId(match.id);
  }

  /* ---- Invalidações ------------------------------------------------------
     Ajustadas durante o render, que é o padrão do React para reagir a uma
     mudança de valor sem passar por um render intermédio inconsistente.
     ----------------------------------------------------------------------- */

  // Mudar de serviço muda a duração, e com ela a grelha de horas. Se o serviço
  // novo não leva barba, o estilo de barba deixa de fazer sentido.
  const [lastServiceType, setLastServiceType] = useState(serviceType);
  if (lastServiceType !== serviceType) {
    setLastServiceType(serviceType);
    setTime('');
    if (!needsBeardStyle) setBeardStyleId(null);
    // Um barbeiro que não preste o serviço novo deixa de poder ficar escolhido.
    if (barberId && !eligibleBarbers.some((b) => b.id === barberId)) setBarberId(null);
  }

  // Outro barbeiro tem outro horário e outro formato de atendimento.
  const [lastBarberId, setLastBarberId] = useState(barberId);
  if (lastBarberId !== barberId) {
    setLastBarberId(barberId);
    setTime('');
    setLocationType(barber?.locationTypes.length === 1 ? barber.locationTypes[0] : null);
  }

  // Outro dia, outra grelha.
  const [lastDate, setLastDate] = useState(date);
  if (lastDate !== date) {
    setLastDate(date);
    setTime('');
  }

  // Limpa a grelha antiga já no render, para não se verem horas de outro dia
  // enquanto as novas não chegam.
  const slotsKey = `${barber?.id ?? ''}|${service?.id ?? ''}|${date}`;
  const [loadedSlotsKey, setLoadedSlotsKey] = useState(slotsKey);
  if (loadedSlotsKey !== slotsKey) {
    setLoadedSlotsKey(slotsKey);
    setSlots([]);
    setLoadingSlots(Boolean(barber && service && date));
  }

  useEffect(() => {
    if (!barber || !service || !date) return;
    let active = true;
    void getAvailableSlots(barber.id, service.id, date).then((result) => {
      if (!active) return;
      setSlots(result);
      setLoadingSlots(false);
    });
    return () => {
      active = false;
    };
  }, [barber, service, date]);

  /* ---- Janela de agendamento -------------------------------------------- */
  // Depende do "agora", por isso só é calculada no cliente.
  const { minDate, maxDate } = useMemo(() => {
    if (!isClient) return { minDate: '', maxDate: '' };
    const today = new Date();
    const last = new Date(today);
    last.setDate(today.getDate() + BOOKING_WINDOW_DAYS);
    return { minDate: toISODate(today), maxDate: toISODate(last) };
  }, [isClient]);

  /** O barbeiro trabalha nesse dia da semana? Dia sem turnos é folga. */
  const isDayEnabled = useCallback(
    (iso: string) => {
      if (!barber) return false;
      const weekDay = parseDate(iso).getDay() as keyof typeof barber.schedule;
      return (barber.schedule[weekDay] ?? []).length > 0;
    },
    [barber],
  );

  /* ---- Validação por passo ---------------------------------------------- */
  /**
   * A razão por que não se pode avançar, ou `null` se se pode.
   *
   * Calculada a cada render, sem memorização: são meia dúzia de comparações de
   * strings e o React Compiler trata disto melhor do que um `useMemo` escrito à
   * mão sobre valores derivados.
   */
  const blocker = ((): string | null => {
    switch (step) {
      case 0:
        return serviceType ? null : 'Escolhe o serviço que queres.';
      case 1:
        if (!styleId) return 'Escolhe o estilo de corte.';
        if (needsBeardStyle && !beardStyleId) return 'Escolhe também o estilo de barba.';
        return null;
      case 2:
        return barberId ? null : 'Escolhe o barbeiro que te vai atender.';
      case 3:
        if (!date) return 'Escolhe o dia.';
        if (!time) return 'Escolhe a hora.';
        return null;
      case 4:
        if (!locationType) return 'Escolhe onde queres ser atendido.';
        if (locationType === 'domicilio' && address.trim().length < 5) {
          return 'Escreve a morada onde queres receber o barbeiro.';
        }
        return null;
      case 5:
        if (name.trim().length < 2) return 'Escreve o teu nome.';
        if (!isValidPhone(phone)) return 'Escreve um telemóvel válido.';
        return null;
      default:
        return null;
    }
  })();

  /* ---- Navegação --------------------------------------------------------- */
  const topRef = useRef<HTMLDivElement>(null);
  /** Só rola depois de o cliente navegar, nunca no primeiro render. */
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!hasNavigated.current) return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const goTo = useCallback((next: StepIndex) => {
    hasNavigated.current = true;
    setShowErrors(false);
    setStep(next);
  }, []);

  const goNext = useCallback(() => {
    if (blocker) {
      setShowErrors(true);
      return;
    }
    if (step < LAST_STEP) goTo((step + 1) as StepIndex);
  }, [blocker, step, goTo]);

  const goBack = useCallback(() => {
    if (step > 0) goTo((step - 1) as StepIndex);
  }, [step, goTo]);

  /* ---- Submissão --------------------------------------------------------- */
  const handleSubmit = useCallback(async () => {
    if (!barber || !service || !serviceType || !locationType) return;
    if (blocker) {
      setShowErrors(true);
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        barberId: barber.id,
        barberName: barber.name,
        serviceId: service.id,
        serviceName: service.name,
        styleName: styleId ? getStyleById(styleId)?.name : undefined,
        beardStyleName: beardStyleId ? getStyleById(beardStyleId)?.name : undefined,
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

      // Para a área do cliente abrir já com a lista, e para o próximo
      // agendamento não voltar a pedir o que já foi escrito.
      setLastPhone(booking.clientPhone);
      setLastName(booking.clientName);
      setConfirmed(booking);
      hasNavigated.current = true;
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Não foi possível agendar.',
        'error',
      );
      // A hora pode ter sido ocupada entretanto — volta a ler a grelha e manda
      // o cliente de volta ao passo da hora, que é onde ele tem de decidir.
      if (barber && service && date) {
        const fresh = await getAvailableSlots(barber.id, service.id, date);
        setSlots(fresh);
        setTime('');
        goTo(3);
      }
    } finally {
      setSubmitting(false);
    }
  }, [barber, service, serviceType, locationType, blocker, styleId, beardStyleId, total, date, time, address, name, phone, notes, showToast, goTo]);

  /* ======================================================================== */
  /* Ecrã final — superfície ESCURA, como no template                         */
  /* ======================================================================== */
  if (confirmed) {
    return (
      <div ref={topRef} data-surface="dark" className="rounded-xl bg-ink px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-gold text-gold">
            <Check className="size-8" />
          </div>

          <h2 className="mt-6 text-3xl text-white">Agendamento confirmado!</h2>
          <p className="mt-3 text-text-muted">
            Falta só avisar o barbeiro. Carrega no botão abaixo — a mensagem de
            WhatsApp já vai escrita, com todos os detalhes.
          </p>

          <dl className="mt-7 space-y-3 rounded-lg border border-white/10 bg-white/5 p-5 text-left text-sm">
            <IconRow icon={<MapPin className="size-4" />}>
              {formatDateLong(confirmed.date)} · {confirmed.time}
            </IconRow>
            <IconRow icon={<HomePin className="size-4" />}>
              {formatLocationType(confirmed.locationType)}
              {confirmed.address ? ` — ${confirmed.address}` : ''}
            </IconRow>
            <IconRow icon={<Check className="size-4" />}>{confirmed.barberName}</IconRow>
            <div className="border-t border-white/10 pt-3">
              <IconRow icon={<HeadCut className="size-4" />}>
                {describeService(confirmed)} · {formatKz(confirmed.price)}
              </IconRow>
            </div>
          </dl>

          <a
            href={bookingWhatsappLink(confirmed)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-md bg-gold px-6 text-base font-bold text-ink transition-transform hover:scale-[1.02]"
          >
            Confirmar pelo WhatsApp
          </a>

          <ButtonLink href="/conta" variant="outline" size="lg" className="mt-3 w-full">
            Ver os meus agendamentos
          </ButtonLink>

          <p className="mt-5 text-xs text-text-muted">{paymentClaim()}.</p>
        </div>
      </div>
    );
  }

  /* ======================================================================== */
  /* Fluxo — superfície CLARA                                                 */
  /* ======================================================================== */
  return (
    <div ref={topRef} className="scroll-mt-20">
      <Stepper current={step} />

      {/* O passo em curso é anunciado para quem usa leitor de ecrã, já que a
          mudança não recarrega a página. */}
      <div className="sr-only" aria-live="polite">
        Passo {step + 1} de {STEPS.length}: {STEPS[step]}.
      </div>

      <div className="mt-8">
        {step === 0 && (
          <StepPanel
            title="Qual é o serviço?"
            subtitle="Escolhe o serviço e continua para seleccionares o estilo, o barbeiro e a hora."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {BOOKABLE_SERVICES.map((option) => {
                const Illustration = option.includesBeard ? HeadBeard : HeadCut;
                return (
                  <SelectableCard
                    key={option.type}
                    label={`${option.name}, desde ${formatKz(option.fromPrice)}`}
                    selected={serviceType === option.type}
                    onSelect={() => setServiceType(option.type)}
                    className="flex flex-col items-center gap-3 py-7 text-center"
                  >
                    <Illustration className="size-14 text-primary-dim" />
                    <span className="block font-bold text-text">{option.name}</span>
                    <span className="tabular block text-sm text-text-muted">
                      Desde {formatKz(option.fromPrice)}
                    </span>
                  </SelectableCard>
                );
              })}
            </div>

            {/* "O que está incluído?" só aparece depois de haver escolha: antes
                disso não há nada de concreto para listar. */}
            {bookable && (
              <div className="mt-7">
                <h3 className="text-base font-bold text-text">O que está incluído?</h3>
                <ul className="mt-3 space-y-2">
                  {bookable.included.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary-dim" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </StepPanel>
        )}

        {step === 1 && (
          <StepPanel
            title="Escolhe o estilo"
            subtitle="Fica registado no agendamento, para o barbeiro já chegar a saber o que queres."
          >
            <StyleGrid
              legend="Estilo de corte"
              styles={haircutStyles}
              selectedId={styleId}
              onSelect={setStyleId}
            />
            {needsBeardStyle && (
              <div className="mt-8">
                <StyleGrid
                  legend="Estilo de barba"
                  styles={beardStyles}
                  selectedId={beardStyleId}
                  onSelect={setBeardStyleId}
                />
              </div>
            )}
          </StepPanel>
        )}

        {step === 2 && (
          <StepPanel
            title="Escolhe o teu barbeiro"
            subtitle="Todos prestam o serviço que escolheste. O preço é o deste profissional."
          >
            <ul className="space-y-3">
              {eligibleBarbers.map((b) => {
                const own = b.services.find((s) => s.type === serviceType);
                return (
                  <li key={b.id}>
                    <SelectableCard
                      label={`${b.name}, ${own ? formatKz(own.price) : ''}`}
                      selected={barberId === b.id}
                      onSelect={() => setBarberId(b.id)}
                      className="flex items-center gap-4 pr-12"
                    >
                      <Image
                        src={b.photo}
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 shrink-0 rounded-md object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-text">{b.name}</span>
                        {b.rating !== null && (
                          <span className="mt-0.5 block">
                            <Rating value={b.rating} count={b.reviewCount} />
                          </span>
                        )}
                        <span className="mt-0.5 block truncate text-sm text-text-muted">
                          {b.specialties.slice(0, 2).join(', ')} · {b.yearsOfExperience} anos de experiência
                        </span>
                        {own && (
                          <span className="tabular mt-1 block text-sm font-bold text-text">
                            {formatKz(own.price)}
                            <span className="font-normal text-text-muted">
                              {' '}· {formatDuration(own.durationMinutes)}
                            </span>
                          </span>
                        )}
                      </span>
                    </SelectableCard>
                  </li>
                );
              })}
            </ul>
          </StepPanel>
        )}

        {step === 3 && (
          <StepPanel
            title="Quando queres o serviço?"
            subtitle={barber ? `Estes são os horários livres do ${firstName(barber.name)}.` : ''}
          >
            {!isClient ? (
              <p className="text-sm text-text-muted">A carregar o calendário…</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <Calendar
                  value={date}
                  onChange={setDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  isDayEnabled={isDayEnabled}
                />

                <div>
                  <h3 className="text-sm font-bold text-text">Horários disponíveis</h3>
                  <div className="mt-3" aria-live="polite">
                    {!date ? (
                      <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                        Escolhe primeiro o dia.
                      </p>
                    ) : loadingSlots ? (
                      <p className="text-sm text-text-muted">A procurar horários…</p>
                    ) : slots.length === 0 ? (
                      <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                        {barber?.name} não atende neste dia. Escolhe outro.
                      </p>
                    ) : slots.every((s) => !s.available) ? (
                      <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                        Já não há horas livres neste dia. Experimenta o dia seguinte.
                      </p>
                    ) : (
                      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
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
                                  : `${slot.time}, ${slot.reason === 'ocupado' ? 'ocupado' : 'indisponível'}`
                              }
                              className={`tabular min-h-[44px] w-full rounded-md border text-sm font-semibold transition-colors ${
                                time === slot.time
                                  ? 'border-gold bg-gold text-ink'
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

                  {date && time && (
                    <p className="mt-4 rounded-md bg-surface-2 p-3 text-sm text-text">
                      <span className="text-text-muted">Escolhido: </span>
                      {formatDateLong(date)}, às {time}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </StepPanel>
        )}

        {step === 4 && barber && (
          <LocationStep
            barber={barber}
            locationType={locationType}
            onLocationType={setLocationType}
            address={address}
            onAddress={setAddress}
            notes={notes}
            onNotes={setNotes}
          />
        )}

        {step === 5 && barber && service && (
          <StepPanel
            title="Confirma o teu agendamento"
            subtitle="Falta só saber quem és, para o barbeiro te poder contactar."
          >
            <div className="space-y-4">
              <Field
                label="Nome"
                id="nome"
                value={name}
                onChange={setName}
                autoComplete="name"
                placeholder="Como te chamas?"
                error={showErrors && name.trim().length < 2 ? 'Escreve o teu nome.' : undefined}
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
                hint="É por aqui que o barbeiro te contacta, e é como voltas a encontrar o agendamento."
                error={
                  (showErrors || phone.length > 0) && !isValidPhone(phone)
                    ? 'Número inválido. Deve ter 9 algarismos e começar por 9.'
                    : undefined
                }
                required
              />
            </div>

            {/* ---- Resumo ---------------------------------------------- */}
            <div className="mt-7 rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-bold text-text">Resumo do agendamento</h3>

              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Serviço" value={service.name} />
                {styleId && <Row label="Estilo de corte" value={getStyleById(styleId)?.name ?? ''} />}
                {beardStyleId && (
                  <Row label="Estilo de barba" value={getStyleById(beardStyleId)?.name ?? ''} />
                )}
                <Row label="Barbeiro" value={barber.name} />
                <Row label="Duração" value={formatDuration(service.durationMinutes)} />
                <Row label="Dia e hora" value={`${formatDateLong(date)}, ${time}`} />
                <Row
                  label="Onde"
                  value={
                    locationType === 'domicilio'
                      ? `${formatLocationType('domicilio')} — ${address.trim()}`
                      : `${formatLocationType('salao')} — ${barber.area}`
                  }
                />
              </dl>

              <h3 className="mt-6 text-base font-bold text-text">Resumo de pagamento</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label={service.name} value={formatKz(service.price)} />
                {locationType === 'domicilio' && (
                  <Row label="Deslocação" value={formatKz(PRICING.homeServiceFee)} />
                )}
                <div className="!mt-3 border-t border-border pt-3">
                  <Row label="Total" value={formatKz(total)} emphasis />
                </div>
              </dl>

              {/* O que se diz sobre o pagamento segue `PAYMENT`, para a
                  interface não prometer uma regra que já mudou. */}
              <p className="mt-4 text-sm text-text-muted">
                {paymentClaim()}. Métodos aceites: {PAYMENT.methods.join(', ')}.
              </p>
            </div>
          </StepPanel>
        )}
      </div>

      {/* ---- Barra de navegação --------------------------------------- */}
      <div className="mt-8">
        {showErrors && blocker && (
          <p role="alert" className="mb-3 text-sm font-medium text-cancelled">
            {blocker}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {step > 0 && (
            <Button type="button" variant="secondary" size="lg" onClick={goBack} className="sm:w-auto">
              ← Voltar
            </Button>
          )}

          {step < LAST_STEP ? (
            <Button
              type="button"
              size="lg"
              onClick={goNext}
              // Nunca desactivado: um botão apagado não diz o que falta. Carregar
              // revela a razão, por cima do botão e em `role="alert"`.
              aria-describedby={showErrors && blocker ? undefined : undefined}
              className="flex-1"
            >
              Continuar <ArrowRight />
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? 'A agendar…' : 'Confirmar agendamento'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Passo da localização                                                       */
/* ========================================================================== */

/**
 * Onde o serviço acontece.
 *
 * O template mostra aqui um mapa. Não há mapa: um mapa a sério precisa de chave
 * de API e de custo mensal, e a zona piloto ainda nem está fechada. Em vez
 * disso há a morada escrita, com dois atalhos — "Casa" e "Trabalho" — guardados
 * neste dispositivo, que resolvem o mesmo problema: não ter de escrever a
 * morada toda outra vez.
 */
function LocationStep({
  barber,
  locationType,
  onLocationType,
  address,
  onAddress,
  notes,
  onNotes,
}: {
  barber: Barber;
  locationType: LocationType | null;
  onLocationType: (type: LocationType) => void;
  address: string;
  onAddress: (value: string) => void;
  notes: string;
  onNotes: (value: string) => void;
}) {
  // As moradas guardadas vivem no `localStorage`, que não existe no servidor:
  // lidas pelo `useIsClient`, como o resto da aplicação, e não num efeito.
  const isClient = useIsClient();
  const stored = useMemo(() => {
    const entries: Record<string, string> = {};
    if (!isClient) return entries;
    for (const slot of ADDRESS_SLOTS) {
      const found = getSavedAddress(slot.id);
      if (found) entries[slot.id] = found.address;
    }
    return entries;
  }, [isClient]);

  // O que foi guardado agora mesmo, por cima do que já estava. Separar os dois
  // evita ter de reler o armazenamento a cada gravação.
  const [justSaved, setJustSaved] = useState<Record<string, string>>({});
  const saved = { ...stored, ...justSaved };

  const store = (id: string, label: string) => {
    saveAddress(id, label, address);
    setJustSaved((current) => ({ ...current, [id]: address.trim() }));
  };

  return (
    <StepPanel
      title="Onde queres o serviço?"
      subtitle="No salão do barbeiro, ou em tua casa — se ele fizer domicílio."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(['salao', 'domicilio'] as const).map((type) => {
          const offered = barber.locationTypes.includes(type);
          const Illustration = type === 'salao' ? MapPin : HomePin;

          if (!offered) {
            return (
              <div
                key={type}
                className="rounded-lg border-2 border-dashed border-border p-4 text-left opacity-60"
              >
                <Illustration className="size-6 text-text-muted" />
                <p className="mt-2 font-bold text-text">{formatLocationType(type)}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {firstName(barber.name)} não faz {type === 'salao' ? 'atendimento no salão' : 'domicílio'}.
                </p>
              </div>
            );
          }

          return (
            <SelectableCard
              key={type}
              label={formatLocationType(type)}
              selected={locationType === type}
              onSelect={() => onLocationType(type)}
              className="pr-12"
            >
              <Illustration className="size-6 text-primary-dim" />
              <span className="mt-2 block font-bold text-text">{formatLocationType(type)}</span>
              <span className="mt-1 block text-sm text-text-muted">
                {type === 'salao'
                  ? barber.area
                  : `+${formatKz(PRICING.homeServiceFee)} de deslocação`}
              </span>
            </SelectableCard>
          );
        })}
      </div>

      {locationType === 'domicilio' && (
        <div className="mt-6">
          {/* Atalhos: preenchem a morada de uma vez. Um atalho vazio mostra-se
              na mesma, a dizer que pode ser preenchido — e lê-se, porque o
              "(vazio)" é informação, não decoração. O que o marca como
              inactivo é o cursor e o atributo `disabled`, não o apagar. */}
          <div className="flex flex-wrap gap-2">
            {ADDRESS_SLOTS.map((slot) => {
              const stored = saved[slot.id];
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => stored && onAddress(stored)}
                  disabled={!stored}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:border-primary-dim disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:border-border"
                  title={stored ?? 'Ainda não guardaste esta morada'}
                >
                  <MapPin className="size-4" />
                  {slot.label}
                  {!stored && <span className="text-xs">(vazio)</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <Field
              label="Morada"
              id="morada"
              value={address}
              onChange={onAddress}
              autoComplete="street-address"
              placeholder="Rua, prédio, andar, ponto de referência"
              hint={`Quanto mais detalhe, mais fácil o barbeiro chegar. Durante o piloto fazemos domicílio em: ${PILOT_AREA.homeServiceAreas.join(', ')}.`}
              required
            />
          </div>

          {address.trim().length >= 5 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-text-muted">Guardar esta morada como:</span>
              {ADDRESS_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => store(slot.id, slot.label)}
                  className="rounded-full border border-border px-3 py-1 font-medium text-text transition-colors hover:border-primary-dim"
                >
                  {slot.label}
                  {saved[slot.id] === address.trim() && ' ✓'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Field
          label="Observações"
          id="observacoes"
          value={notes}
          onChange={onNotes}
          placeholder="Alguma coisa que o barbeiro deva saber?"
          optional
        />
      </div>
    </StepPanel>
  );
}

/* ========================================================================== */
/* Peças internas                                                             */
/* ========================================================================== */

/** O cabeçalho comum a todos os passos: título, subtítulo e o conteúdo. */
function StepPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-lg text-text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A grelha de estilos, com a fotografia e o visto de selecção. */
function StyleGrid({
  legend,
  styles,
  selectedId,
  onSelect,
}: {
  legend: string;
  styles: Style[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-text">{legend}</legend>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {styles.map((style) => {
          const selected = selectedId === style.id;
          return (
            <li key={style.id}>
              <button
                type="button"
                onClick={() => onSelect(style.id)}
                aria-pressed={selected}
                aria-label={`${style.name}: ${style.description}`}
                className={`group block w-full overflow-hidden rounded-lg border-2 text-left transition-colors ${
                  selected ? 'border-selected-border bg-selected' : 'border-border bg-surface hover:border-primary-dim'
                }`}
              >
                <span className="relative block aspect-[4/5] w-full">
                  <Image
                    src={style.photo}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 220px"
                    className="object-cover"
                  />
                  <SelectionMark selected={selected} className="absolute right-2 top-2" />
                </span>
                <span className="block p-3">
                  <span className="block text-sm font-bold text-text">{style.name}</span>
                  <span className="block text-xs text-text-muted">{style.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
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
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd
        className={`tabular text-right ${
          emphasis ? 'text-base font-bold text-text' : 'font-medium text-text'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Linha do cartão do ecrã final: um ícone dourado e o texto. */
function IconRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-white">
      <span className="mt-0.5 shrink-0 text-gold" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
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
      <label htmlFor={id} className="block text-sm font-bold text-text">
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
        className={`mt-1.5 min-h-[48px] w-full rounded-md border bg-surface px-3 text-base text-text placeholder:text-text-muted/60 ${
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

/* ---- Utilitários locais -------------------------------------------------- */

/** "Edson Kiala" → "Edson". Para falar do barbeiro sem soletrar o nome todo. */
function firstName(name: string): string {
  return name.split(' ')[0];
}

/** "Corte degradê · Degradê clássico + Barba curta" — o serviço por extenso. */
function describeService(booking: Booking): string {
  const styles = [booking.styleName, booking.beardStyleName].filter(Boolean);
  return styles.length > 0 ? `${booking.serviceName} · ${styles.join(' + ')}` : booking.serviceName;
}
