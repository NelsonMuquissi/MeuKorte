'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useIsClient } from '@/hooks/useIsClient';
import type {
  Barber,
  Barbershop,
  Booking,
  LocationType,
  Service,
  ServiceType,
  ShopTimeSlot,
} from '@/types';
import { haircutStyles, beardStyles, getStyleById } from '@/data/styles';
import { getShopSlots, createBooking, calculatePrice } from '@/services/bookingsService';
import { getShopBarbers } from '@/services/barbershopsService';
import {
  ADDRESS_SLOTS,
  getSavedAddress,
  getLastName,
  getLastPhone,
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
import { Stepper } from '@/components/booking/Stepper';
import { SelectableCard, SelectionMark } from '@/components/booking/SelectableCard';
import { Calendar } from '@/components/booking/Calendar';
import { Rating } from '@/components/ui/Rating';
import { HeadCut, HeadBeard, Check, MapPin, HomePin, Scissors } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

/**
 * Jornada do salão.
 *
 *   Barbearia → Formato → Corte → Barbeiro e hora → Confirmação
 *
 * Existe ao lado de `/agendar` porque os dois públicos chegam com perguntas
 * diferentes. Quem quer o barbeiro em casa pergunta "quem me vai cortar?" e
 * escolhe primeiro o profissional. Quem vai ao salão pergunta "qual é a casa
 * mais perto de mim, e a que horas?" — e obrigá-lo a escolher um barbeiro antes
 * de saber sequer onde fica a casa é pôr a pergunta errada à frente.
 *
 * Daí a diferença que mais conta: **o barbeiro é opcional**. Quem tem barbeiro
 * de preferência escolhe-o; quem só quer despachar fica com "qualquer um
 * disponível" e vê mais horas livres, porque a grelha passa a ser a união da
 * casa inteira. A atribuição faz-se no momento de confirmar, a partir de quem
 * estava livre naquela hora.
 *
 * Nenhum preço, taxa ou regra está escrito aqui: vêm todos de `business.ts`.
 */

const STEPS = ['Barbearia', 'Formato', 'Corte', 'Hora', 'Confirmação'] as const;
const LAST_STEP = STEPS.length - 1;

/** O valor que representa "não escolhi barbeiro nenhum". */
const ANY_BARBER = '';

export function SalonFlow({
  shops,
  areas,
}: {
  shops: Barbershop[];
  areas: string[];
}) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isClient = useIsClient();

  /* ---- Escolhas --------------------------------------------------------- */
  const [step, setStep] = useState(0);
  const [area, setArea] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<LocationType | null>(null);
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [beardStyleId, setBeardStyleId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string>(ANY_BARBER);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const [shopBarbers, setShopBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<ShopTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
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
  const needsBeardStyle = bookable?.includesBeard ?? false;

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
  const total = calculatePrice(basePrice, locationType ?? 'salao');

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
  // Outra casa: outros barbeiros, outros formatos, outras horas.
  const [lastShopId, setLastShopId] = useState(shopId);
  if (lastShopId !== shopId) {
    setLastShopId(shopId);
    setBarberId(ANY_BARBER);
    setTime('');
    setLocationType(shop?.locationTypes.length === 1 ? shop.locationTypes[0] : null);
  }

  // Outro formato muda quem atende; outro serviço muda a duração.
  const gridKey = `${shopId ?? ''}|${locationType ?? ''}|${serviceType ?? ''}|${date}`;
  const [lastGridKey, setLastGridKey] = useState(gridKey);
  if (lastGridKey !== gridKey) {
    setLastGridKey(gridKey);
    setTime('');
    setSlots([]);
    setLoadingSlots(Boolean(shopId && locationType && serviceType && date));
  }

  if (!needsBeardStyle && beardStyleId) setBeardStyleId(null);

  /* ---- Carregamentos ----------------------------------------------------- */
  // Os barbeiros da casa, para o formato escolhido.
  useEffect(() => {
    if (!shopId || !locationType) return;
    let active = true;
    void getShopBarbers(shopId, locationType).then((list) => {
      if (!active) return;
      setShopBarbers(list);
      setBarberId((current) => {
        // Com um só barbeiro, não há escolha nenhuma a fazer: fica logo ele.
        if (list.length === 1) return list[0].id;
        // Se o escolhido já não atende neste formato, volta a "qualquer um".
        return current && !list.some((b) => b.id === current) ? ANY_BARBER : current;
      });
    });
    return () => {
      active = false;
    };
  }, [shopId, locationType]);

  // A grelha da casa inteira.
  useEffect(() => {
    if (!shopId || !locationType || !serviceType || !date) return;
    let active = true;
    void getShopSlots(shopId, serviceType, date, locationType).then((result) => {
      if (!active) return;
      setSlots(result);
      setLoadingSlots(false);
    });
    return () => {
      active = false;
    };
  }, [shopId, locationType, serviceType, date]);

  /* ---- Janela de agendamento --------------------------------------------- */
  const { minDate, maxDate } = useMemo(() => {
    if (!isClient) return { minDate: '', maxDate: '' };
    const today = new Date();
    const last = new Date(today);
    last.setDate(today.getDate() + BOOKING_WINDOW_DAYS);
    return { minDate: toISODate(today), maxDate: toISODate(last) };
  }, [isClient]);

  /**
   * Que dias se podem escolher.
   *
   * No salão é o horário da casa que decide; ao domicílio é o de quem atende,
   * porque a porta da casa não entra na conta.
   */
  // Função simples, sem memorização à mão: os valores de que depende são
  // derivados a cada render e o React Compiler trata disto melhor do que um
  // `useCallback` escrito sobre eles.
  const isDayEnabled = (iso: string): boolean => {
    const weekDay = parseDate(iso).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    if (locationType === 'salao') {
      return shop ? (shop.schedule[weekDay] ?? []).length > 0 : false;
    }
    const relevant = barber ? [barber] : shopBarbers;
    return relevant.some((b) => (b.schedule[weekDay] ?? []).length > 0);
  };

  /**
   * As horas visíveis: todas as da casa, ou só as de quem foi escolhido.
   *
   * Filtrar aqui em vez de voltar a pedir ao serviço é de propósito: a grelha
   * da casa já sabe quem está livre a cada hora, por isso trocar de barbeiro
   * não devia custar outra volta ao armazenamento.
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
        return shopId ? null : 'Escolhe a barbearia.';
      case 1:
        if (!locationType) return 'Escolhe se queres ser atendido no salão ou em tua casa.';
        if (locationType === 'domicilio' && address.trim().length < 5) {
          return 'Escreve a morada onde queres receber o barbeiro.';
        }
        return null;
      case 2:
        if (!serviceType) return 'Escolhe o serviço.';
        if (!styleId) return 'Escolhe o estilo de corte.';
        if (needsBeardStyle && !beardStyleId) return 'Escolhe também o estilo de barba.';
        return null;
      case 3:
        if (!date) return 'Escolhe o dia.';
        if (!time) return 'Escolhe a hora.';
        return null;
      case 4:
        if (name.trim().length < 2) return 'Escreve o teu nome.';
        if (!isValidPhone(phone)) return 'Escreve um telemóvel válido.';
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
    if (!shop || !serviceType || !locationType) return;
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
      showToast('Essa hora já não está livre. Escolhe outra.', 'error');
      const fresh = await getShopSlots(shop.id, serviceType, date, locationType);
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
        styleName: styleId ? getStyleById(styleId)?.name : undefined,
        beardStyleName: beardStyleId ? getStyleById(beardStyleId)?.name : undefined,
        price: calculatePrice(assignedService.price, locationType),
        durationMinutes: assignedService.durationMinutes,
        date,
        time,
        locationType,
        address: locationType === 'domicilio' ? address.trim() : undefined,
        clientName: name.trim(),
        clientPhone: phone,
        notes: notes.trim() || undefined,
      });

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
      const fresh = await getShopSlots(shop.id, serviceType, date, locationType);
      setSlots(fresh);
      setTime('');
      goTo(3);
    } finally {
      setSubmitting(false);
    }
  }, [shop, serviceType, locationType, blocker, slots, time, barberId, shopBarbers, styleId, beardStyleId, date, address, name, phone, notes, showToast, goTo]);

  /* ======================================================================== */
  /* Ecrã final                                                               */
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
            Falta só avisar a barbearia. Carrega no botão abaixo — a mensagem de
            WhatsApp já vai escrita, com todos os detalhes.
          </p>

          <dl className="mt-7 space-y-3 rounded-lg border border-white/10 bg-white/5 p-5 text-left text-sm">
            <IconRow icon={<MapPin className="size-4" />}>
              {confirmed.barbershopName}
              {confirmed.address ? ` — ${confirmed.address}` : ''}
            </IconRow>
            <IconRow icon={<HomePin className="size-4" />}>
              {formatDateLong(confirmed.date)} · {confirmed.time}
            </IconRow>
            <IconRow icon={<Check className="size-4" />}>{confirmed.barberName}</IconRow>
            <div className="border-t border-white/10 pt-3">
              <IconRow icon={<Scissors className="size-4" />}>
                {describe(confirmed)} · {formatKz(confirmed.price)}
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
  /* Jornada                                                                  */
  /* ======================================================================== */
  return (
    <div ref={topRef} className="scroll-mt-20">
      <Stepper current={step} steps={STEPS} />

      <div className="sr-only" aria-live="polite">
        Passo {step + 1} de {STEPS.length}: {STEPS[step]}.
      </div>

      <div className="mt-8">
        {/* ---- 1. Barbearia ------------------------------------------- */}
        {step === 0 && (
          <StepPanel
            title="Qual é a barbearia?"
            subtitle="Filtra pela tua zona e escolhe a casa onde queres cortar."
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

            <ul className="mt-6 space-y-3">
              {visibleShops.map((s) => (
                <li key={s.id}>
                  <SelectableCard
                    label={`${s.name}, ${s.area}`}
                    selected={shopId === s.id}
                    onSelect={() => setShopId(s.id)}
                    className="flex gap-4 pr-12"
                  >
                    <Image
                      src={s.photo}
                      alt=""
                      width={80}
                      height={80}
                      className="size-20 shrink-0 rounded-md object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-text">{s.name}</span>
                      <span className="mt-0.5 flex items-start gap-1.5 text-sm text-text-muted">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        <span className="min-w-0">{s.address}</span>
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {s.locationTypes.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted"
                          >
                            {formatLocationType(t)}
                          </span>
                        ))}
                      </span>
                    </span>
                  </SelectableCard>
                </li>
              ))}
            </ul>

            {visibleShops.length === 0 && (
              <p className="mt-6 rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                Ainda não temos casa aberta nesta zona. Durante o piloto fazemos
                domicílio em: {PILOT_AREA.homeServiceAreas.join(', ')}.
              </p>
            )}
          </StepPanel>
        )}

        {/* ---- 2. Formato ---------------------------------------------- */}
        {step === 1 && shop && (
          <StepPanel
            title="No salão ou em tua casa?"
            subtitle={`${shop.name} — ${shop.address}`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(['salao', 'domicilio'] as const).map((type) => {
                const offered = shop.locationTypes.includes(type);
                const Illustration = type === 'salao' ? MapPin : HomePin;

                if (!offered) {
                  return (
                    <div
                      key={type}
                      className="rounded-lg border-2 border-dashed border-border p-4 opacity-60"
                    >
                      <Illustration className="size-6 text-text-muted" />
                      <p className="mt-2 font-bold text-text">{formatLocationType(type)}</p>
                      <p className="mt-1 text-sm text-text-muted">
                        Esta casa não faz {type === 'salao' ? 'atendimento no salão' : 'domicílio'}.
                      </p>
                    </div>
                  );
                }

                return (
                  <SelectableCard
                    key={type}
                    label={formatLocationType(type)}
                    selected={locationType === type}
                    onSelect={() => setLocationType(type)}
                    className="pr-12"
                  >
                    <Illustration className="size-6 text-primary-dim" />
                    <span className="mt-2 block font-bold text-text">
                      {formatLocationType(type)}
                    </span>
                    <span className="mt-1 block text-sm text-text-muted">
                      {type === 'salao'
                        ? shop.area
                        : `+${formatKz(PRICING.homeServiceFee)} de deslocação`}
                    </span>
                  </SelectableCard>
                );
              })}
            </div>

            {locationType === 'domicilio' && (
              <AddressField value={address} onChange={setAddress} />
            )}
          </StepPanel>
        )}

        {/* ---- 3. Corte ------------------------------------------------ */}
        {step === 2 && (
          <StepPanel
            title="Que corte queres?"
            subtitle="O estilo fica registado, para o barbeiro já saber o que queres."
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

            {bookable && (
              <>
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

                <div className="mt-8">
                  <StyleGrid
                    legend="Estilo de corte"
                    styles={haircutStyles}
                    selectedId={styleId}
                    onSelect={setStyleId}
                  />
                </div>

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
              </>
            )}
          </StepPanel>
        )}

        {/* ---- 4. Barbeiro e hora -------------------------------------- */}
        {step === 3 && shop && (
          <StepPanel
            title="Com quem e a que horas?"
            subtitle={
              shopBarbers.length > 1
                ? 'Se não fizeres questão, fica com quem estiver livre — e vês mais horas.'
                : 'Escolhe o dia e a hora.'
            }
          >
            {/* O barbeiro primeiro, porque é ele que decide as horas. */}
            <fieldset>
              <legend className="text-sm font-bold text-text">Barbeiro</legend>
              <ul className="mt-3 space-y-2">
                {/* Só faz sentido oferecer "qualquer um" quando há mais do que
                    um: com um barbeiro só, a opção não abre hora nenhuma a
                    mais e a frase "mais horas livres" era mentira. */}
                {shopBarbers.length > 1 && (
                <li>
                  <SelectableCard
                    label="Qualquer barbeiro disponível"
                    selected={barberId === ANY_BARBER}
                    onSelect={() => setBarberId(ANY_BARBER)}
                    className="flex items-center gap-4 pr-12"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary-dim">
                      <Scissors className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-text">
                        Qualquer um disponível
                      </span>
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
                        className="flex items-center gap-4 pr-12"
                      >
                        <Image
                          src={b.photo}
                          alt=""
                          width={48}
                          height={48}
                          className="size-12 shrink-0 rounded-md object-cover"
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
                              {formatKz(own.price)} · {formatDuration(own.durationMinutes)}
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
                    <h3 className="text-sm font-bold text-text">Horários disponíveis</h3>
                    <div className="mt-3" aria-live="polite">
                      {!date ? (
                        <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                          Escolhe primeiro o dia.
                        </p>
                      ) : loadingSlots ? (
                        <p className="text-sm text-text-muted">A procurar horários…</p>
                      ) : visibleSlots.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                          {locationType === 'salao'
                            ? 'A casa não abre neste dia. Escolhe outro.'
                            : 'Ninguém atende neste dia. Escolhe outro.'}
                        </p>
                      ) : visibleSlots.every((s) => !s.available) ? (
                        <p className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
                          {barberId
                            ? 'Este barbeiro já não tem horas livres neste dia. Experimenta "qualquer um disponível" ou outro dia.'
                            : 'Já não há horas livres neste dia. Experimenta o dia seguinte.'}
                        </p>
                      ) : (
                        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
                          {visibleSlots.map((slot) => (
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
                                      : 'cursor-not-allowed border-border/50 bg-surface/40 text-text-muted/70 line-through'
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
            </div>
          </StepPanel>
        )}

        {/* ---- 5. Confirmação ------------------------------------------ */}
        {step === 4 && shop && (
          <StepPanel
            title="Confirma o teu agendamento"
            subtitle="Falta só saber quem és, para a barbearia te poder contactar."
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
              />
              <Field
                label="Telemóvel"
                id="telemovel"
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
                placeholder="923 456 789"
                hint="É por aqui que a barbearia te contacta, e é como voltas a encontrar o agendamento."
                error={
                  (showErrors || phone.length > 0) && !isValidPhone(phone)
                    ? 'Número inválido. Deve ter 9 algarismos e começar por 9.'
                    : undefined
                }
              />
              <Field
                label="Observações"
                id="observacoes"
                value={notes}
                onChange={setNotes}
                placeholder="Alguma coisa que o barbeiro deva saber?"
                optional
              />
            </div>

            <div className="mt-7 rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-bold text-text">Resumo do agendamento</h3>

              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Barbearia" value={shop.name} />
                <Row
                  label="Onde"
                  value={
                    locationType === 'domicilio'
                      ? `${formatLocationType('domicilio')} — ${address.trim()}`
                      : `${formatLocationType('salao')} — ${shop.address}`
                  }
                />
                <Row label="Serviço" value={bookable?.name ?? ''} />
                {styleId && <Row label="Estilo de corte" value={getStyleById(styleId)?.name ?? ''} />}
                {beardStyleId && (
                  <Row label="Estilo de barba" value={getStyleById(beardStyleId)?.name ?? ''} />
                )}
                <Row
                  label="Barbeiro"
                  value={barber ? barber.name : 'Quem estiver livre à hora escolhida'}
                />
                <Row label="Dia e hora" value={`${formatDateLong(date)}, ${time}`} />
              </dl>

              <h3 className="mt-6 text-base font-bold text-text">Resumo de pagamento</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <Row
                  label={bookable?.name ?? 'Serviço'}
                  value={service ? formatKz(basePrice) : `Desde ${formatKz(basePrice)}`}
                />
                {locationType === 'domicilio' && (
                  <Row label="Deslocação" value={formatKz(PRICING.homeServiceFee)} />
                )}
                <div className="!mt-3 border-t border-border pt-3">
                  <Row
                    label="Total"
                    value={service ? formatKz(total) : `Desde ${formatKz(total)}`}
                    emphasis
                  />
                </div>
              </dl>

              {/* Sem barbeiro escolhido não há preço fechado: cada profissional
                  tem a sua tabela. Dizê-lo é melhor do que mostrar um número
                  que pode mudar na confirmação. */}
              {!service && (
                <p className="mt-3 text-sm text-text-muted">
                  O valor exacto depende de quem te atender, e aparece na
                  confirmação. Escolhe um barbeiro no passo anterior se quiseres
                  o preço fechado já.
                </p>
              )}

              <p className="mt-4 text-sm text-text-muted">
                {paymentClaim()}. Métodos aceites: {PAYMENT.methods.join(', ')}.
              </p>
            </div>
          </StepPanel>
        )}
      </div>

      {/* ---- Navegação ------------------------------------------------ */}
      <div className="mt-8">
        {showErrors && blocker && (
          <p role="alert" className="mb-3 text-sm font-medium text-cancelled">
            {blocker}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {step > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => goTo(step - 1)}
              className="sm:w-auto"
            >
              ← Voltar
            </Button>
          )}

          {step < LAST_STEP ? (
            <Button type="button" size="lg" onClick={goNext} className="flex-1">
              Continuar <ArrowRight />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'A agendar…' : 'Confirmar agendamento'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Peças internas                                                             */
/* ========================================================================== */

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
          ? 'border-selected-border bg-selected text-text'
          : 'border-border bg-surface text-text-muted hover:border-primary-dim'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * A morada, com os atalhos guardados — os mesmos de `/agendar` e da área do
 * cliente, pelo mesmo serviço.
 */
function AddressField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isClient = useIsClient();
  const saved = useMemo(() => {
    const entries: Record<string, string> = {};
    if (!isClient) return entries;
    for (const slot of ADDRESS_SLOTS) {
      const found = getSavedAddress(slot.id);
      if (found) entries[slot.id] = found.address;
    }
    return entries;
  }, [isClient]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {ADDRESS_SLOTS.map((slot) => {
          const stored = saved[slot.id];
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => stored && onChange(stored)}
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
          value={value}
          onChange={onChange}
          autoComplete="street-address"
          placeholder="Rua, prédio, andar, ponto de referência"
          hint={`Quanto mais detalhe, mais fácil o barbeiro chegar. Durante o piloto fazemos domicílio em: ${PILOT_AREA.homeServiceAreas.join(', ')}.`}
        />
      </div>
    </div>
  );
}

function StyleGrid({
  legend,
  styles,
  selectedId,
  onSelect,
}: {
  legend: string;
  styles: { id: string; name: string; description: string; photo: string }[];
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
                className={`block w-full overflow-hidden rounded-lg border-2 text-left transition-colors ${
                  selected
                    ? 'border-selected-border bg-selected'
                    : 'border-border bg-surface hover:border-primary-dim'
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

/** "Corte + barba · Degradê + Barba curta" — o serviço com os estilos. */
function describe(booking: Booking): string {
  const styles = [booking.styleName, booking.beardStyleName].filter(Boolean);
  return styles.length > 0 ? `${booking.serviceName} · ${styles.join(' + ')}` : booking.serviceName;
}
