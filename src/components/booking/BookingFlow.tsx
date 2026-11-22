'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useIsClient } from '@/hooks/useIsClient';
import type { Barber, Booking, LocationType, Service, ServiceType, TimeSlot } from '@/types';
import { beardDesign } from '@/data/styles';
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
import {
  formatKz,
  formatDuration,
  toISODate,
  parseDate,
  isValidPhone,
  formatLocationType,
} from '@/lib/format';
import { BOOKABLE_SERVICES, BOOKING_WINDOW_DAYS, PRICING, PILOT_AREA } from '@/config/business';
import { Stepper, STEPS, type StepIndex } from './Stepper';
import { SelectableCard } from './SelectableCard';
import { Calendar } from './Calendar';
import {
  StepPanel,
  FlowNav,
  ServiceChooser,
  StyleChooser,
  styleBlocker,
  styleLabel,
  SlotGrid,
  Field,
  BookingReview,
  BookingConfirmed,
  dateLabel,
} from './FlowParts';
import { Rating } from '@/components/ui/Rating';
import { MapPin, HomePin } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

/**
 * Jornada do domicílio — seis passos, um ecrã de cada vez.
 *
 *   Serviço → Estilo → Barbeiro → Agendamento → Localização → Confirmação
 *
 * Um passo por ecrã, e não tudo numa página: no telemóvel, que é onde a maioria
 * vai estar, uma página com seis secções abertas obriga a rolar às cegas e
 * esconde o que falta decidir. Com um passo de cada vez há sempre uma só
 * pergunta à vista, e o `Stepper` mostra onde se está.
 *
 * O serviço escolhe-se antes do barbeiro, por isso o tipo de serviço
 * (`ServiceType`) existe ao nível da plataforma, em `BOOKABLE_SERVICES`, e só
 * no passo 3 — quando já há barbeiro — é que se encontra o `Service` concreto,
 * com o preço e a duração reais desse profissional. Daí "Desde X Kz" no
 * primeiro passo.
 *
 * O desenho de cada passo vive em `FlowParts`, partilhado com a jornada do
 * salão. Nenhum preço, taxa ou regra está escrito aqui: vêm de `business.ts`.
 */

const LAST_STEP = (STEPS.length - 1) as StepIndex;

export function BookingFlow({ barbers }: { barbers: Barber[] }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isClient = useIsClient();

  /* ---- Escolhas --------------------------------------------------------- */
  const [step, setStep] = useState<StepIndex>(0);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [otherStyle, setOtherStyle] = useState('');
  const [beard, setBeard] = useState(false);
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
  const includesBeard = bookable?.includesBeard ?? false;

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
   * O telemóvel e o nome do último agendamento, para não os escrever outra vez.
   *
   * Só existem no cliente, por isso passam pelo `useIsClient` em vez de um
   * efeito com `setState`. O `undefined` quer dizer "ainda não foi tocado":
   * nesse caso vale o valor guardado.
   */
  const savedPhone = useMemo(() => (isClient ? getLastPhone() : null), [isClient]);
  const [phoneOverride, setPhone] = useState<string | undefined>(undefined);
  const phone = phoneOverride ?? savedPhone ?? '';

  const savedName = useMemo(() => (isClient ? getLastName() : null), [isClient]);
  const [nameOverride, setName] = useState<string | undefined>(undefined);
  const name = nameOverride ?? savedName ?? '';

  /* ---- Barbeiro vindo de `?barbeiro=` ----------------------------------- */
  // Vem dos cards e do perfil. Fica pré-escolhido, mas o passo 3 aparece na
  // mesma: quem chegou pelo perfil de um barbeiro pode mudar de ideias.
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
  // novo não leva barba, a preferência de barba deixa de fazer sentido.
  const [lastServiceType, setLastServiceType] = useState(serviceType);
  if (lastServiceType !== serviceType) {
    setLastServiceType(serviceType);
    setTime('');
    if (!includesBeard) setBeard(false);
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
  /** A razão por que não se pode avançar, ou `null` se se pode. */
  const blocker = ((): string | null => {
    switch (step) {
      case 0:
        return serviceType ? null : 'Escolha o serviço que procura.';
      case 1:
        return styleBlocker(styleId, otherStyle);
      case 2:
        return barberId ? null : 'Escolha o barbeiro que o vai atender.';
      case 3:
        if (!date) return 'Escolha o dia.';
        if (!time) return 'Escolha a hora.';
        return null;
      case 4:
        if (!locationType) return 'Escolha onde quer ser atendido.';
        if (locationType === 'domicilio' && address.trim().length < 5) {
          return 'Escreva a morada onde quer receber o barbeiro.';
        }
        return null;
      case 5:
        if (name.trim().length < 2) return 'Escreva o seu nome.';
        if (!isValidPhone(phone)) return 'Escreva um telemóvel válido.';
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
        styleName: styleLabel(styleId, otherStyle),
        beardStyleName: includesBeard && beard ? beardDesign.name : undefined,
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
      // o cliente de volta ao passo da hora, que é onde tem de decidir.
      if (barber && service && date) {
        const fresh = await getAvailableSlots(barber.id, service.id, date);
        setSlots(fresh);
        setTime('');
        goTo(3);
      }
    } finally {
      setSubmitting(false);
    }
  }, [barber, service, serviceType, locationType, blocker, styleId, otherStyle, includesBeard, beard, total, date, time, address, name, phone, notes, showToast, goTo]);

  /* ======================================================================== */
  /* Ecrã final                                                               */
  /* ======================================================================== */
  if (confirmed) {
    return (
      <div ref={topRef} className="scroll-mt-20">
        <Stepper current={LAST_STEP} />
        <div className="mt-10">
          <BookingConfirmed booking={confirmed} barber={barber} />
        </div>
      </div>
    );
  }

  /* ======================================================================== */
  /* Fluxo                                                                    */
  /* ======================================================================== */
  return (
    <div ref={topRef} className="scroll-mt-20">
      <Stepper current={step} />

      {/* O passo em curso é anunciado para quem usa leitor de ecrã, já que a
          mudança não recarrega a página. */}
      <div className="sr-only" aria-live="polite">
        Passo {step + 1} de {STEPS.length}: {STEPS[step]}.
      </div>

      <div className="mt-10">
        {step === 0 && (
          <StepPanel
            eyebrow="Serviço"
            title="Qual é o serviço que procura?"
            subtitle="Escolha o serviço que deseja e continue para seleccionar o estilo, o barbeiro e definir o melhor horário para si."
          >
            <ServiceChooser value={serviceType} onChange={setServiceType} />
          </StepPanel>
        )}

        {step === 1 && (
          <StepPanel
            eyebrow="Estilo"
            title="Escolha o seu estilo"
            subtitle={
              includesBeard
                ? 'Seleccione o estilo de cabelo e personalize o acabamento da barba. As suas preferências serão partilhadas com o barbeiro antes do atendimento.'
                : 'Seleccione o estilo de cabelo. A sua preferência será partilhada com o barbeiro antes do atendimento.'
            }
          >
            <StyleChooser
              includesBeard={includesBeard}
              styleId={styleId}
              onStyle={setStyleId}
              otherText={otherStyle}
              onOtherText={setOtherStyle}
              beard={beard}
              onBeard={setBeard}
              showErrors={showErrors}
            />
          </StepPanel>
        )}

        {step === 2 && (
          <StepPanel
            eyebrow="Barbeiro"
            title="Escolha o seu barbeiro"
            subtitle="Todos prestam o serviço que escolheu. O preço é o de cada profissional."
          >
            <ul className="grid gap-3 md:grid-cols-2">
              {eligibleBarbers.map((b) => {
                const own = b.services.find((s) => s.type === serviceType);
                return (
                  <li key={b.id}>
                    <SelectableCard
                      label={`${b.name}, ${own ? formatKz(own.price) : ''}`}
                      selected={barberId === b.id}
                      onSelect={() => setBarberId(b.id)}
                      className="flex h-full items-center gap-4 p-3 pr-12"
                    >
                      <Image
                        src={b.photo}
                        alt=""
                        width={112}
                        height={112}
                        className="aspect-square w-24 shrink-0 rounded-lg object-cover sm:w-28"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-bold text-text">{b.name}</span>
                        {b.rating !== null && (
                          <span className="mt-0.5 block">
                            <Rating value={b.rating} count={b.reviewCount} />
                          </span>
                        )}
                        <span className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                          <MapPin className="size-4 shrink-0" />
                          {b.area} · {b.yearsOfExperience} anos de experiência
                        </span>
                        {own && (
                          <span className="tabular mt-1.5 block font-bold text-accent">
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
            eyebrow="Agendamento"
            title="Quando quer o serviço?"
            subtitle={barber ? `Estes são os horários livres de ${barber.name}.` : undefined}
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
                  <h3 className="font-sans text-base font-bold tracking-normal">Horários disponíveis</h3>
                  <div className="mt-3" aria-live="polite">
                    {!date ? (
                      <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                        Escolha primeiro o dia.
                      </p>
                    ) : loadingSlots ? (
                      <p className="text-sm text-text-muted">A procurar horários…</p>
                    ) : slots.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                        {barber?.name} não atende neste dia. Escolha outro.
                      </p>
                    ) : slots.every((s) => !s.available) ? (
                      <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                        Já não há horas livres neste dia. Experimente o dia seguinte.
                      </p>
                    ) : (
                      <SlotGrid slots={slots} value={time} onChange={setTime} />
                    )}
                  </div>

                  {date && time && (
                    <p className="mt-4 rounded-xl bg-selected p-3 text-sm text-text">
                      <span className="text-text-muted">Escolhido: </span>
                      {dateLabel(date)}, às {time}.
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
            eyebrow="Confirmação"
            title="Tudo pronto!"
            subtitle="Revise os detalhes do seu agendamento. Em seguida, é só confirmar e preparar-se para uma experiência única."
          >
            <BookingReview
              date={date}
              time={time}
              place={
                locationType === 'domicilio'
                  ? { title: 'Endereço', lines: [address.trim()] }
                  : { title: 'No salão', lines: [barber.area] }
              }
              barber={barber}
              serviceName={bookable?.name ?? service.name}
              durationMinutes={service.durationMinutes}
              servicePrice={service.price}
              isFromPrice={false}
              homeFee={locationType === 'domicilio'}
              style={styleLabel(styleId, otherStyle)}
              beard={includesBeard && beard}
            >
              <Field
                label="Nome"
                id="nome"
                value={name}
                onChange={setName}
                autoComplete="name"
                placeholder="Como se chama?"
                error={showErrors && name.trim().length < 2 ? 'Escreva o seu nome.' : undefined}
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
                error={
                  (showErrors || phone.length > 0) && !isValidPhone(phone)
                    ? 'Número inválido. Deve ter 9 algarismos e começar por 9.'
                    : undefined
                }
                required
              />
            </BookingReview>
          </StepPanel>
        )}
      </div>

      <FlowNav
        canGoBack={step > 0}
        onBack={goBack}
        onNext={step < LAST_STEP ? goNext : handleSubmit}
        nextLabel={step < LAST_STEP ? 'Continuar' : submitting ? 'A agendar…' : 'Confirmar agendamento'}
        busy={submitting}
        error={showErrors ? blocker : null}
      />
    </div>
  );
}

/* ========================================================================== */
/* Passo da localização                                                       */
/* ========================================================================== */

/**
 * Onde o serviço acontece.
 *
 * O template original mostrava aqui um mapa. Não há mapa: um mapa a sério precisa de chave
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
      eyebrow="Localização"
      title="Onde quer ser atendido?"
      subtitle="No local da sua preferência, ou no salão do barbeiro — se ele atender no salão."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(['domicilio', 'salao'] as const).map((type) => {
          const offered = barber.locationTypes.includes(type);
          const Illustration = type === 'salao' ? MapPin : HomePin;

          if (!offered) {
            return (
              <div
                key={type}
                className="rounded-xl border-2 border-dashed border-border p-4 text-left opacity-60"
              >
                <Illustration className="size-6 text-text-muted" />
                <p className="mt-2 font-bold text-text">{formatLocationType(type)}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {barber.name} não faz {type === 'salao' ? 'atendimento no salão' : 'domicílio'}.
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
              <Illustration className="size-7 text-gold" />
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
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:border-gold disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:border-border"
                  title={stored ?? 'Ainda não guardou esta morada'}
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
                  className="rounded-full border border-border px-3 py-1 font-medium text-text transition-colors hover:border-gold"
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
          placeholder="Alguma coisa que o barbeiro deva saber? (ex.: ponto de referência)"
          optional
        />
      </div>
    </StepPanel>
  );
}
