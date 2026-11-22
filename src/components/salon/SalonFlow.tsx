'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useIsClient } from '@/hooks/useIsClient';
import type { Barber, Barbershop, Booking, Service, ServiceType, ShopTimeSlot } from '@/types';
import { beardDesign } from '@/data/styles';
import { getShopSlots, createBooking } from '@/services/bookingsService';
import { getShopBarbers } from '@/services/barbershopsService';
import { getLastName, getLastPhone, setLastName, setLastPhone } from '@/services/profileService';
import { formatKz, formatDuration, toISODate, parseDate, isValidPhone } from '@/lib/format';
import { BOOKABLE_SERVICES, BOOKING_WINDOW_DAYS, PILOT_AREA } from '@/config/business';
import { Stepper } from '@/components/booking/Stepper';
import { SelectableCard } from '@/components/booking/SelectableCard';
import { Calendar } from '@/components/booking/Calendar';
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
} from '@/components/booking/FlowParts';
import { Rating } from '@/components/ui/Rating';
import { MapPin, Scissors } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

/**
 * Jornada do salão.
 *
 *   Barbearia → Serviço → Estilo → Barbeiro e hora → Confirmação
 *
 * Existe ao lado de `/agendar` porque os dois públicos chegam com perguntas
 * diferentes. Quem quer o barbeiro em casa pergunta "quem me vai cortar?" e
 * escolhe primeiro o profissional. Quem vai ao salão pergunta "qual é a casa
 * mais perto de mim, e a que horas?" — e obrigá-lo a escolher um barbeiro antes
 * de saber sequer onde fica a casa é pôr a pergunta errada à frente.
 *
 * É SEMPRE no salão. O passo "No salão ou em sua casa?" saiu a pedido do
 * cliente (Novembro de 2026): quem quer o barbeiro em casa tem a sua jornada,
 * e perguntar outra vez aqui só baralhava as duas.
 *
 * O barbeiro é opcional: quem tem barbeiro de preferência escolhe-o; quem só
 * quer despachar fica com "qualquer um disponível" e vê mais horas livres,
 * porque a grelha passa a ser a união da casa inteira. A atribuição faz-se no
 * momento de confirmar, a partir de quem estava livre naquela hora.
 *
 * Os passos do serviço, do estilo e do resumo são os mesmos de `/agendar`
 * (`FlowParts`). Nenhum preço, taxa ou regra está escrito aqui.
 */

const STEPS = ['Barbearia', 'Serviço', 'Estilo', 'Hora', 'Confirmação'] as const;
const LAST_STEP = STEPS.length - 1;

/** O valor que representa "não escolhi barbeiro nenhum". */
const ANY_BARBER = '';

/** Esta jornada é sempre no salão. */
const LOCATION = 'salao' as const;

export function SalonFlow({
  shops: allShops,
  areas,
}: {
  shops: Barbershop[];
  areas: string[];
}) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isClient = useIsClient();

  /** Só entram as casas que atendem no salão. */
  const shops = useMemo(() => allShops.filter((s) => s.locationTypes.includes(LOCATION)), [allShops]);

  /* ---- Escolhas --------------------------------------------------------- */
  const [step, setStep] = useState(0);
  const [area, setArea] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [otherStyle, setOtherStyle] = useState('');
  const [beard, setBeard] = useState(false);
  const [barberId, setBarberId] = useState<string>(ANY_BARBER);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const [shopBarbers, setShopBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<ShopTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ booking: Booking; barber: Barber } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  /* ---- Identificação já conhecida --------------------------------------- */
  const savedPhone = useMemo(() => (isClient ? getLastPhone() : null), [isClient]);
  const savedName = useMemo(() => (isClient ? getLastName() : null), [isClient]);
  const [phoneOverride, setPhone] = useState<string | undefined>(undefined);
  const [nameOverride, setName] = useState<string | undefined>(undefined);
  const phone = phoneOverride ?? savedPhone ?? '';
  const name = nameOverride ?? savedName ?? '';

  /* ---- Valores derivados ------------------------------------------------ */
  const shop = shops.find((s) => s.id === shopId) ?? null;
  const bookable = BOOKABLE_SERVICES.find((s) => s.type === serviceType) ?? null;
  const includesBeard = bookable?.includesBeard ?? false;

  const visibleShops = area ? shops.filter((s) => s.area === area) : shops;

  /** O barbeiro escolhido, ou `null` quando é "qualquer um". */
  const barber = barberId ? shopBarbers.find((b) => b.id === barberId) ?? null : null;

  /** O serviço concreto do barbeiro escolhido — é onde o preço deixa de ser "desde". */
  const service: Service | null =
    barber && serviceType ? barber.services.find((s) => s.type === serviceType) ?? null : null;

  /**
   * O preço a mostrar antes de haver barbeiro.
   *
   * Com "qualquer um disponível" não há tabela de preços única: cada
   * profissional tem a sua. Mostra-se o mais barato da casa, dito como "desde",
   * e o valor exacto aparece quando o barbeiro for atribuído.
   */
  const shopFromPrice = useMemo(() => {
    if (!serviceType) return null;
    const prices = shopBarbers
      .map((b) => b.services.find((s) => s.type === serviceType)?.price)
      .filter((p): p is number => p !== undefined);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [shopBarbers, serviceType]);

  const basePrice = service?.price ?? shopFromPrice ?? 0;

  /* ---- `?barbearia=` vindo da home e da lista ---------------------------- */
  const preselected = searchParams.get('barbearia');
  const [appliedPreselection, setAppliedPreselection] = useState(false);
  if (!appliedPreselection && preselected) {
    setAppliedPreselection(true);
    const match = shops.find((s) => s.id === preselected || s.slug === preselected);
    if (match) {
      setShopId(match.id);
      setArea(match.area);
    }
  }

  /* ---- Invalidações ------------------------------------------------------ */
  // Outra casa: outros barbeiros, outras horas.
  const [lastShopId, setLastShopId] = useState(shopId);
  if (lastShopId !== shopId) {
    setLastShopId(shopId);
    setBarberId(ANY_BARBER);
    setTime('');
  }

  // Outro serviço muda a duração, e com ela a grelha.
  const gridKey = `${shopId ?? ''}|${serviceType ?? ''}|${date}`;
  const [lastGridKey, setLastGridKey] = useState(gridKey);
  if (lastGridKey !== gridKey) {
    setLastGridKey(gridKey);
    setTime('');
    setSlots([]);
    setLoadingSlots(Boolean(shopId && serviceType && date));
  }

  if (!includesBeard && beard) setBeard(false);

  /* ---- Carregamentos ----------------------------------------------------- */
  // Os barbeiros da casa que atendem no salão.
  useEffect(() => {
    if (!shopId) return;
    let active = true;
    void getShopBarbers(shopId, LOCATION).then((list) => {
      if (!active) return;
      setShopBarbers(list);
      setBarberId((current) => {
        // Com um só barbeiro, não há escolha nenhuma a fazer: fica logo ele.
        if (list.length === 1) return list[0].id;
        return current && !list.some((b) => b.id === current) ? ANY_BARBER : current;
      });
    });
    return () => {
      active = false;
    };
  }, [shopId]);

  // A grelha da casa inteira.
  useEffect(() => {
    if (!shopId || !serviceType || !date) return;
    let active = true;
    void getShopSlots(shopId, serviceType, date, LOCATION).then((result) => {
      if (!active) return;
      setSlots(result);
      setLoadingSlots(false);
    });
    return () => {
      active = false;
    };
  }, [shopId, serviceType, date]);

  /* ---- Janela de agendamento --------------------------------------------- */
  const { minDate, maxDate } = useMemo(() => {
    if (!isClient) return { minDate: '', maxDate: '' };
    const today = new Date();
    const last = new Date(today);
    last.setDate(today.getDate() + BOOKING_WINDOW_DAYS);
    return { minDate: toISODate(today), maxDate: toISODate(last) };
  }, [isClient]);

  /** No salão é o horário da casa que decide que dias se podem escolher. */
  const isDayEnabled = (iso: string): boolean => {
    const weekDay = parseDate(iso).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    return shop ? (shop.schedule[weekDay] ?? []).length > 0 : false;
  };

  /**
   * As horas visíveis: todas as da casa, ou só as de quem foi escolhido.
   *
   * Filtrar aqui em vez de voltar a pedir ao serviço é de propósito: a grelha
   * da casa já sabe quem está livre a cada hora.
   */
  const visibleSlots = barberId
    ? slots.map((s) => ({
        ...s,
        available: s.available && s.barberIds.includes(barberId),
        barberIds: s.barberIds.filter((id) => id === barberId),
      }))
    : slots;

  /* ---- Validação --------------------------------------------------------- */
  const blocker = ((): string | null => {
    switch (step) {
      case 0:
        return shopId ? null : 'Escolha a barbearia.';
      case 1:
        return serviceType ? null : 'Escolha o serviço que procura.';
      case 2:
        return styleBlocker(styleId, otherStyle);
      case 3:
        if (!date) return 'Escolha o dia.';
        if (!time) return 'Escolha a hora.';
        return null;
      case 4:
        if (name.trim().length < 2) return 'Escreva o seu nome.';
        if (!isValidPhone(phone)) return 'Escreva um telemóvel válido.';
        return null;
      default:
        return null;
    }
  })();

  /* ---- Navegação ---------------------------------------------------------- */
  const topRef = useRef<HTMLDivElement>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!hasNavigated.current) return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const goTo = useCallback((next: number) => {
    hasNavigated.current = true;
    setShowErrors(false);
    setStep(next);
  }, []);

  const goNext = useCallback(() => {
    if (blocker) {
      setShowErrors(true);
      return;
    }
    if (step < LAST_STEP) goTo(step + 1);
  }, [blocker, step, goTo]);

  /* ---- Submissão ---------------------------------------------------------- */
  const handleSubmit = useCallback(async () => {
    if (!shop || !serviceType) return;
    if (blocker) {
      setShowErrors(true);
      return;
    }

    // Quem foi escolhido, ou o primeiro que tem esta hora livre.
    const slot = slots.find((s) => s.time === time);
    const assignedId = barberId || slot?.barberIds[0];
    const assigned = shopBarbers.find((b) => b.id === assignedId);
    const assignedService = assigned?.services.find((s) => s.type === serviceType);

    if (!assigned || !assignedService) {
      showToast('Essa hora já não está livre. Escolha outra.', 'error');
      const fresh = await getShopSlots(shop.id, serviceType, date, LOCATION);
      setSlots(fresh);
      setTime('');
      goTo(3);
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        barberId: assigned.id,
        barberName: assigned.name,
        barbershopId: shop.id,
        barbershopName: shop.name,
        serviceId: assignedService.id,
        serviceName: assignedService.name,
        styleName: styleLabel(styleId, otherStyle),
        beardStyleName: includesBeard && beard ? beardDesign.name : undefined,
        price: assignedService.price,
        durationMinutes: assignedService.durationMinutes,
        date,
        time,
        locationType: LOCATION,
        clientName: name.trim(),
        clientPhone: phone,
        notes: notes.trim() || undefined,
      });

      setLastPhone(booking.clientPhone);
      setLastName(booking.clientName);
      setConfirmed({ booking, barber: assigned });
      hasNavigated.current = true;
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Não foi possível agendar.',
        'error',
      );
      const fresh = await getShopSlots(shop.id, serviceType, date, LOCATION);
      setSlots(fresh);
      setTime('');
      goTo(3);
    } finally {
      setSubmitting(false);
    }
  }, [shop, serviceType, blocker, slots, time, barberId, shopBarbers, styleId, otherStyle, includesBeard, beard, date, name, phone, notes, showToast, goTo]);

  /* ======================================================================== */
  /* Ecrã final                                                               */
  /* ======================================================================== */
  if (confirmed) {
    return (
      <div ref={topRef} className="scroll-mt-20">
        <Stepper current={LAST_STEP} steps={STEPS} />
        <div className="mt-10">
          <BookingConfirmed booking={confirmed.booking} barber={confirmed.barber} />
        </div>
      </div>
    );
  }

  /* ======================================================================== */
  /* Jornada                                                                  */
  /* ======================================================================== */
  return (
    <div ref={topRef} className="scroll-mt-20">
      <Stepper current={step} steps={STEPS} />

      <div className="sr-only" aria-live="polite">
        Passo {step + 1} de {STEPS.length}: {STEPS[step]}.
      </div>

      <div className="mt-10">
        {/* ---- 1. Barbearia ------------------------------------------- */}
        {step === 0 && (
          <StepPanel
            eyebrow="Barbearia"
            title="Qual é a barbearia?"
            subtitle="Filtre pela sua zona e escolha a casa onde quer cortar."
          >
            <fieldset>
              <legend className="text-sm font-bold text-text">Zona</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <ZoneChip label="Todas" active={area === null} onClick={() => setArea(null)} />
                {areas.map((a) => (
                  <ZoneChip key={a} label={a} active={area === a} onClick={() => setArea(a)} />
                ))}
              </div>
            </fieldset>

            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {visibleShops.map((s) => (
                <li key={s.id}>
                  <SelectableCard
                    label={`${s.name}, ${s.area}`}
                    selected={shopId === s.id}
                    onSelect={() => setShopId(s.id)}
                    className="flex h-full gap-4 p-3 pr-12"
                  >
                    <Image
                      src={s.photo}
                      alt=""
                      width={96}
                      height={96}
                      className="aspect-square w-20 shrink-0 rounded-lg object-cover sm:w-24"
                    />
                    <span className="min-w-0 flex-1 py-1">
                      <span className="block text-lg font-bold text-text">{s.name}</span>
                      <span className="mt-1 flex items-start gap-1.5 text-sm text-text-muted">
                        <MapPin className="mt-0.5 size-4 shrink-0" />
                        <span className="min-w-0">{s.address}</span>
                      </span>
                    </span>
                  </SelectableCard>
                </li>
              ))}
            </ul>

            {visibleShops.length === 0 && (
              <p className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                Ainda não temos casa aberta nesta zona. Se preferir, o barbeiro
                vai até si: durante o piloto fazemos domicílio em{' '}
                {PILOT_AREA.homeServiceAreas.join(', ')}.
              </p>
            )}
          </StepPanel>
        )}

        {/* ---- 2. Serviço ---------------------------------------------- */}
        {step === 1 && (
          <StepPanel
            eyebrow="Serviço"
            title="Qual é o serviço que procura?"
            subtitle={shop ? `${shop.name} — ${shop.address}` : undefined}
          >
            <ServiceChooser value={serviceType} onChange={setServiceType} />
          </StepPanel>
        )}

        {/* ---- 3. Estilo ----------------------------------------------- */}
        {step === 2 && (
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

        {/* ---- 4. Barbeiro e hora -------------------------------------- */}
        {step === 3 && shop && (
          <StepPanel
            eyebrow="Hora"
            title="Com quem e a que horas?"
            subtitle={
              shopBarbers.length > 1
                ? 'Se não fizer questão, fica com quem estiver livre — e vê mais horas.'
                : 'Escolha o dia e a hora.'
            }
          >
            {/* O barbeiro primeiro, porque é ele que decide as horas. */}
            <fieldset>
              <legend className="font-sans text-base font-bold tracking-normal">Barbeiro</legend>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {/* Só faz sentido oferecer "qualquer um" quando há mais do que
                    um: com um barbeiro só, a opção não abre hora nenhuma a
                    mais e a frase "mais horas livres" era mentira. */}
                {shopBarbers.length > 1 && (
                  <li>
                    <SelectableCard
                      label="Qualquer barbeiro disponível"
                      selected={barberId === ANY_BARBER}
                      onSelect={() => setBarberId(ANY_BARBER)}
                      className="flex h-full items-center gap-4 p-3 pr-12"
                    >
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-icon-bg text-ink">
                        <Scissors className="size-6" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-text">Qualquer um disponível</span>
                        <span className="block text-sm text-text-muted">
                          {shopFromPrice !== null
                            ? `Desde ${formatKz(shopFromPrice)} · mais horas livres`
                            : 'Mais horas livres'}
                        </span>
                      </span>
                    </SelectableCard>
                  </li>
                )}

                {shopBarbers.map((b) => {
                  const own = serviceType
                    ? b.services.find((s) => s.type === serviceType)
                    : undefined;
                  return (
                    <li key={b.id}>
                      <SelectableCard
                        label={`${b.name}${own ? `, ${formatKz(own.price)}` : ''}`}
                        selected={barberId === b.id}
                        onSelect={() => setBarberId(b.id)}
                        className="flex h-full items-center gap-4 p-3 pr-12"
                      >
                        <Image
                          src={b.photo}
                          alt=""
                          width={80}
                          height={80}
                          className="aspect-square w-16 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-text">{b.name}</span>
                          {b.rating !== null && (
                            <span className="mt-0.5 block">
                              <Rating value={b.rating} count={b.reviewCount} />
                            </span>
                          )}
                          {own && (
                            <span className="tabular mt-0.5 block text-sm text-text-muted">
                              <span className="font-bold text-accent">{formatKz(own.price)}</span>
                              {' '}· {formatDuration(own.durationMinutes)}
                            </span>
                          )}
                        </span>
                      </SelectableCard>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <div className="mt-8">
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
                      ) : visibleSlots.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                          A casa não abre neste dia. Escolha outro.
                        </p>
                      ) : visibleSlots.every((s) => !s.available) ? (
                        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                          {barberId
                            ? 'Este barbeiro já não tem horas livres neste dia. Experimente "qualquer um disponível" ou outro dia.'
                            : 'Já não há horas livres neste dia. Experimente o dia seguinte.'}
                        </p>
                      ) : (
                        <SlotGrid slots={visibleSlots} value={time} onChange={setTime} />
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
            </div>
          </StepPanel>
        )}

        {/* ---- 5. Confirmação ------------------------------------------ */}
        {step === 4 && shop && bookable && (
          <StepPanel
            eyebrow="Confirmação"
            title="Tudo pronto!"
            subtitle="Revise os detalhes do seu agendamento. Em seguida, é só confirmar e preparar-se para uma experiência única."
          >
            <BookingReview
              date={date}
              time={time}
              place={{ title: shop.name, lines: [shop.address] }}
              barber={barber}
              barberFallback={{ title: 'Qualquer barbeiro disponível', subtitle: shop.name, photo: shop.photo }}
              serviceName={bookable.name}
              durationMinutes={service?.durationMinutes}
              servicePrice={basePrice}
              isFromPrice={!service}
              homeFee={false}
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
              />
              <div className="sm:col-span-2">
                <Field
                  label="Observações"
                  id="observacoes"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Alguma coisa que o barbeiro deva saber?"
                  optional
                />
              </div>
            </BookingReview>
          </StepPanel>
        )}
      </div>

      <FlowNav
        canGoBack={step > 0}
        onBack={() => goTo(step - 1)}
        onNext={step < LAST_STEP ? goNext : handleSubmit}
        nextLabel={step < LAST_STEP ? 'Continuar' : submitting ? 'A agendar…' : 'Confirmar agendamento'}
        busy={submitting}
        error={showErrors ? blocker : null}
      />
    </div>
  );
}

/* ========================================================================== */
/* Peças internas                                                             */
/* ========================================================================== */

function ZoneChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[40px] rounded-full border px-4 text-sm font-medium transition-colors ${
        active
          ? 'border-gold bg-gold text-ink'
          : 'border-border bg-surface text-text hover:border-gold/60'
      }`}
    >
      {label}
    </button>
  );
}
