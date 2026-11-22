'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Barber, Booking, ServiceType, TimeSlot } from '@/types';
import { haircutStyles, beardDesign, getStyleById, OTHER_STYLE_ID } from '@/data/styles';
import { BOOKABLE_SERVICES, CANCELLATION, PAYMENT, PRICING, paymentClaim } from '@/config/business';
import { bookingWhatsappLink, generalWhatsappLink } from '@/lib/whatsapp';
import { formatKz, formatDuration, formatDateLong } from '@/lib/format';
import { Button, ArrowRight } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import {
  HeadCut, HeadBeard, Check, MapPin, Scissors, CalendarIcon, CreditCard, Info,
  Pencil, Beard, ChevronRight, WhatsApp, ArrowRightIcon,
} from '@/components/ui/Icons';
import { SelectionMark } from './SelectableCard';

/**
 * Peças partilhadas pelas duas jornadas (`/agendar` e `/salao`).
 *
 * O desenho é o das referências de Novembro de 2026 em `Novas_Referencias/`:
 *   - `Modern Barber Booking Service Selection.png` — o passo do serviço
 *   - `Korte. Estilo de Corte Premium.png`          — o passo do estilo
 *   - `Modern Barber Booking Confirmation.png`      — "Tudo pronto!"
 *   - `Agendamento de Barbeiro Confirmado.png`      — o ecrã final
 *
 * As duas jornadas fazem perguntas por ordens diferentes, mas cada pergunta
 * faz-se da mesma maneira — por isso as peças vivem aqui e os fluxos só
 * decidem a ordem e as regras.
 */

/* ========================================================================== */
/* Estrutura do passo                                                         */
/* ========================================================================== */

/** Cabeçalho comum: rótulo dourado, título grande, subtítulo e o conteúdo. */
export function StepPanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 max-w-2xl text-text-muted sm:text-lg">{subtitle}</p>}
      <div className="mt-7">{children}</div>
    </section>
  );
}

/** Subtítulo numerado dentro de um passo: "① Estilo de cabelo". */
export function NumberedHeading({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 font-sans text-lg font-bold tracking-normal">
      <span className="flex size-7 items-center justify-center rounded-full bg-gold text-sm text-ink">
        {n}
      </span>
      {children}
    </h3>
  );
}

/**
 * Barra de navegação do fluxo: "← Voltar" e "Continuar →" (ou o botão final).
 *
 * O "Continuar" nunca fica desactivado: um botão apagado não diz o que falta.
 * Carregar revela a razão, por cima do botão e em `role="alert"`.
 */
export function FlowNav({
  canGoBack,
  onBack,
  onNext,
  nextLabel = 'Continuar',
  busy = false,
  error,
}: {
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  error?: string | null;
}) {
  return (
    <div className="mt-10">
      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-cancelled">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canGoBack ? (
          <Button type="button" variant="secondary" size="lg" onClick={onBack} className="sm:px-9">
            ← Voltar
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}

        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={busy}
          className={`sm:min-w-[300px] ${canGoBack ? '' : 'sm:mx-auto sm:w-full sm:max-w-xl'}`}
        >
          {nextLabel} <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Passo do serviço                                                           */
/* ========================================================================== */

/**
 * Os dois serviços, com fotografia, e "O que está incluído?" por baixo do
 * escolhido. O preço de referência ("Desde X Kz") fica no card: o real vem
 * do barbeiro.
 */
export function ServiceChooser({
  value,
  onChange,
}: {
  value: ServiceType | null;
  onChange: (type: ServiceType) => void;
}) {
  const chosen = BOOKABLE_SERVICES.find((s) => s.type === value) ?? null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {BOOKABLE_SERVICES.map((option) => {
          const selected = value === option.type;
          const Illustration = option.includesBeard ? HeadBeard : HeadCut;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onChange(option.type)}
              aria-pressed={selected}
              aria-label={`${option.name}, desde ${formatKz(option.fromPrice)}`}
              className={`relative flex w-full items-stretch gap-4 rounded-xl border-2 p-3 text-left transition-colors sm:gap-5 sm:p-4 ${
                selected ? 'border-selected-border bg-selected' : 'border-border bg-surface hover:border-gold/60'
              }`}
            >
              <span className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-lg sm:w-36">
                <Image src={option.photo} alt="" fill sizes="144px" className="object-cover" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center py-1 pr-6">
                <Illustration className="size-9 text-gold sm:size-11" />
                <span className="mt-2 block text-lg font-bold text-text sm:text-xl">{option.name}</span>
                <span className="mt-1 block text-sm text-text-muted">{option.description}</span>
                <span className="tabular mt-2 block text-sm font-semibold text-text">
                  Desde {formatKz(option.fromPrice)}
                </span>
              </span>
              <SelectionMark selected={selected} />
            </button>
          );
        })}
      </div>

      {/* "O que está incluído?" só depois de haver escolha: antes disso não
          há nada de concreto para listar. */}
      {chosen && (
        <div className="mt-7 rounded-xl border border-border bg-surface p-5">
          <h3 className="font-sans text-base font-bold tracking-normal">O que está incluído?</h3>
          <ul className="mt-3 space-y-2">
            {chosen.included.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                {item}.
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ========================================================================== */
/* Passo do estilo                                                            */
/* ========================================================================== */

/**
 * "Escolha o seu estilo": quatro cortes com fotografia, um "Outro estilo"
 * descrito por palavras e, quando o serviço leva barba, "Desenhar barba".
 *
 * O corte é obrigatório (um dos quatro, ou "Outro" com descrição). A barba
 * desenhada é uma preferência e é opcional.
 */
export function StyleChooser({
  includesBeard,
  styleId,
  onStyle,
  otherText,
  onOtherText,
  beard,
  onBeard,
  showErrors,
}: {
  includesBeard: boolean;
  styleId: string | null;
  onStyle: (id: string) => void;
  otherText: string;
  onOtherText: (value: string) => void;
  beard: boolean;
  onBeard: (value: boolean) => void;
  showErrors: boolean;
}) {
  const otherSelected = styleId === OTHER_STYLE_ID;

  return (
    <div className="space-y-9">
      <fieldset>
        <legend className="contents">
          <NumberedHeading n={1}>Estilo de cabelo</NumberedHeading>
        </legend>

        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {haircutStyles.map((style) => {
            const selected = styleId === style.id;
            return (
              <li key={style.id}>
                <button
                  type="button"
                  onClick={() => onStyle(style.id)}
                  aria-pressed={selected}
                  aria-label={`${style.name}: ${style.description}`}
                  className={`block h-full w-full overflow-hidden rounded-xl border-2 text-left transition-colors ${
                    selected ? 'border-selected-border bg-selected' : 'border-border bg-surface hover:border-gold/60'
                  }`}
                >
                  <span className="relative block aspect-[17/12] w-full">
                    <Image
                      src={style.photo}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 50vw, 240px"
                      className="object-cover"
                    />
                    <SelectionMark selected={selected} onPhoto className="absolute right-2.5 top-2.5" />
                  </span>
                  <span className="block p-3 sm:p-4">
                    <span className="block font-bold text-text">{style.name}</span>
                    <span className="mt-0.5 block text-sm text-text-muted">{style.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Outro estilo: uma linha que abre um campo de texto. */}
        <div
          className={`mt-4 rounded-xl border-2 transition-colors ${
            otherSelected ? 'border-selected-border bg-selected' : 'border-border bg-surface'
          }`}
        >
          <button
            type="button"
            onClick={() => onStyle(OTHER_STYLE_ID)}
            aria-pressed={otherSelected}
            aria-expanded={otherSelected}
            aria-controls="outro-estilo"
            className="flex w-full items-center gap-4 p-4 text-left"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-icon-bg text-ink">
              <Pencil className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-text">Outro estilo</span>
              <span className="block text-sm text-text-muted">
                Descreva o corte pretendido (ex.: corte militar, moicano, etc.).
              </span>
            </span>
            <ChevronRight
              className={`size-5 shrink-0 text-text-muted transition-transform ${otherSelected ? 'rotate-90' : ''}`}
            />
          </button>

          {otherSelected && (
            <div id="outro-estilo" className="px-4 pb-4">
              <label htmlFor="outro-estilo-texto" className="sr-only">
                Descreva o corte pretendido
              </label>
              <textarea
                id="outro-estilo-texto"
                value={otherText}
                onChange={(e) => onOtherText(e.target.value)}
                rows={2}
                autoFocus
                placeholder="Ex.: corte militar, curto dos lados e com volume em cima"
                aria-invalid={showErrors && otherText.trim().length < 3 ? true : undefined}
                className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-base text-text placeholder:text-text-muted/70 ${
                  showErrors && otherText.trim().length < 3 ? 'border-cancelled' : 'border-border focus:border-gold'
                }`}
              />
            </div>
          )}
        </div>
      </fieldset>

      {includesBeard && (
        <fieldset>
          <legend className="contents">
            <NumberedHeading n={2}>Estilo de barba</NumberedHeading>
          </legend>

          <button
            type="button"
            onClick={() => onBeard(!beard)}
            aria-pressed={beard}
            className={`relative mt-4 flex w-full items-stretch overflow-hidden rounded-xl border-2 text-left transition-colors ${
              beard ? 'border-selected-border bg-selected' : 'border-border bg-surface hover:border-gold/60'
            }`}
          >
            <span className="relative hidden w-56 shrink-0 sm:block">
              <Image src={beardDesign.photo} alt="" fill sizes="224px" className="object-cover" />
            </span>
            <span className="flex flex-1 items-center gap-4 p-4 pr-12 sm:p-5 sm:pr-14">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-icon-bg text-ink">
                <Beard className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-text">{beardDesign.name}</span>
                <span className="block text-sm text-text-muted">{beardDesign.description}</span>
              </span>
            </span>
            <SelectionMark selected={beard} />
          </button>
        </fieldset>
      )}
    </div>
  );
}

/**
 * Valida o passo do estilo. Devolve a razão por que não se pode avançar.
 * Fica ao lado do `StyleChooser` para as duas jornadas validarem igual.
 */
export function styleBlocker(styleId: string | null, otherText: string): string | null {
  if (!styleId) return 'Escolha o estilo de cabelo.';
  if (styleId === OTHER_STYLE_ID && otherText.trim().length < 3) {
    return 'Descreva o corte pretendido.';
  }
  return null;
}

/** O nome do estilo para guardar no agendamento ("Outro: corte militar"). */
export function styleLabel(styleId: string | null, otherText: string): string | undefined {
  if (!styleId) return undefined;
  if (styleId === OTHER_STYLE_ID) return `Outro: ${otherText.trim()}`;
  return getStyleById(styleId)?.name;
}

/* ========================================================================== */
/* Grelha de horas                                                            */
/* ========================================================================== */

export function SlotGrid({
  slots,
  value,
  onChange,
}: {
  slots: TimeSlot[];
  value: string;
  onChange: (time: string) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
      {slots.map((slot) => (
        <li key={slot.time}>
          <button
            type="button"
            disabled={!slot.available}
            onClick={() => onChange(slot.time)}
            aria-pressed={value === slot.time}
            aria-label={
              slot.available
                ? `${slot.time}, disponível`
                : `${slot.time}, ${slot.reason === 'ocupado' ? 'ocupado' : 'indisponível'}`
            }
            className={`tabular min-h-[46px] w-full rounded-lg border text-sm font-semibold transition-colors ${
              value === slot.time
                ? 'border-gold bg-gold text-ink'
                : slot.available
                  ? 'border-border bg-surface text-text hover:border-gold/60'
                  : 'cursor-not-allowed border-border/50 bg-surface-2/50 text-text-muted/70 line-through'
            }`}
          >
            {slot.time}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ========================================================================== */
/* Formulário                                                                 */
/* ========================================================================== */

export function Field({
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
        className={`mt-1.5 min-h-[50px] w-full rounded-lg border bg-surface px-3.5 text-base text-text placeholder:text-text-muted/70 ${
          error ? 'border-cancelled' : 'border-border focus:border-gold'
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

/* ========================================================================== */
/* Resumo — "Tudo pronto!" e o ecrã final                                     */
/* ========================================================================== */

/** "sábado, 23 de Novembro de 2026" → "Sábado, 23 de Novembro de 2026". */
export function dateLabel(iso: string): string {
  const text = formatDateLong(iso);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A regra de alteração e cancelamento, com o número de `business.ts`. */
export function PolicyNote({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl bg-surface-2 p-4 ${className}`}>
      <Info className="mt-0.5 size-6 shrink-0 text-gold" />
      <div className="text-sm">
        <p className="text-text">
          Pode alterar o seu agendamento até {CANCELLATION.minHoursBefore} horas antes do horário marcado.
        </p>
        <p className="mt-0.5 text-text-muted">
          Em caso de imprevisto, agradecemos que nos avise. Temos uma tolerância de{' '}
          {CANCELLATION.lateToleranceMinutes} minutos de atraso.
        </p>
      </div>
    </div>
  );
}

/** Círculo creme com um ícone dourado-escuro, como nos cartões das referências. */
function IconBadge({ children, size = 'md' }: { children: ReactNode; size?: 'md' | 'lg' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-icon-bg text-ink ${
        size === 'lg' ? 'size-14' : 'size-11'
      }`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** A ficha do barbeiro no resumo: fotografia, nome, estrelas e zona. */
function BarberBlock({
  barber,
  fallback,
}: {
  barber: Barber | null;
  fallback?: { title: string; subtitle: string; photo?: string };
}) {
  const photo = barber?.photo ?? fallback?.photo;
  return (
    <div className="flex items-center gap-4">
      {photo ? (
        <span className="relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-lg sm:w-40">
          <Image src={photo} alt="" fill sizes="160px" className="object-cover" />
        </span>
      ) : (
        <IconBadge size="lg">
          <Scissors className="size-6" />
        </IconBadge>
      )}
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-text sm:text-xl">{barber?.name ?? fallback?.title}</p>
        {barber?.rating != null && (
          <p className="mt-1">
            <Rating value={barber.rating} count={barber.reviewCount} size="md" />
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
          <MapPin className="size-4 shrink-0" />
          {barber?.area ?? fallback?.subtitle}
        </p>
      </div>
    </div>
  );
}

/** A caixa do serviço: ícone, nome, duração e preço. */
function ServiceBox({
  name,
  durationMinutes,
  price,
  priceNote,
}: {
  name: string;
  durationMinutes?: number;
  price: string;
  /** Linha por baixo do preço, ex.: "inclui deslocação". */
  priceNote?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-surface-2 p-4">
      <IconBadge>
        <Scissors className="size-5" />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-text">{name}</p>
        {durationMinutes !== undefined && (
          <p className="text-sm text-text-muted">Duração estimada: {formatDuration(durationMinutes)}</p>
        )}
      </div>
      <div className="w-full pl-15 sm:w-auto sm:shrink-0 sm:pl-0 sm:text-right">
        <p className="tabular text-lg font-extrabold text-text sm:text-xl">{price}</p>
        {priceNote && <p className="text-xs text-text-muted">{priceNote}</p>}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-1 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}

/**
 * "Tudo pronto!" — o resumo antes de confirmar.
 *
 * O preço pode ainda ser "desde": na jornada do salão com "qualquer um
 * disponível" o barbeiro só é atribuído ao confirmar, e cada um tem a sua
 * tabela. Nesse caso diz-se, em vez de mostrar um número que pode mudar.
 */
export function BookingReview({
  date,
  time,
  place,
  barber,
  barberFallback,
  serviceName,
  durationMinutes,
  servicePrice,
  isFromPrice,
  homeFee,
  style,
  beard,
  children,
}: {
  date: string;
  time: string;
  place: { title: string; lines: string[] };
  barber: Barber | null;
  barberFallback?: { title: string; subtitle: string; photo?: string };
  serviceName: string;
  durationMinutes?: number;
  servicePrice: number;
  isFromPrice: boolean;
  homeFee: boolean;
  style?: string;
  beard?: boolean;
  /** Os campos de contacto, entre o resumo e a nota final. */
  children: ReactNode;
}) {
  const total = servicePrice + (homeFee ? PRICING.homeServiceFee : 0);
  const money = (value: number) => (isFromPrice ? `Desde ${formatKz(value)}` : formatKz(value));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
          <IconBadge size="lg">
            <CalendarIcon className="size-6" />
          </IconBadge>
          <div>
            <p className="font-bold text-text">Data e hora</p>
            <p className="text-text-muted">{dateLabel(date)}</p>
            <p className="tabular text-lg font-bold text-text">{time}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
          <IconBadge size="lg">
            <MapPin className="size-6" />
          </IconBadge>
          <div className="min-w-0">
            <p className="font-bold text-text">{place.title}</p>
            {place.lines.map((line) => (
              <p key={line} className="text-text-muted">{line}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-center lg:divide-x lg:divide-border">
          <BarberBlock barber={barber} fallback={barberFallback} />
          <div className="lg:pl-6">
            <ServiceBox name={serviceName} durationMinutes={durationMinutes} price={money(servicePrice)} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 border-t border-border pt-6 lg:grid-cols-2 lg:divide-x lg:divide-border">
          <div>
            <h3 className="flex items-center gap-3 font-sans text-base font-bold tracking-normal">
              <CalendarIcon className="size-5 text-gold" />
              Resumo do agendamento
            </h3>
            <dl className="mt-3 sm:pl-8">
              <SummaryRow label="Serviço" value={serviceName} />
              {style && <SummaryRow label="Estilo" value={style} />}
              {beard && <SummaryRow label="Barba" value={beardDesign.name} />}
              <SummaryRow label="Barbeiro" value={barber?.name ?? 'Quem estiver livre à hora escolhida'} />
              <SummaryRow label="Data e hora" value={`${dateLabel(date)} · ${time}`} />
            </dl>
          </div>

          <div className="lg:pl-6">
            <h3 className="flex items-center gap-3 font-sans text-base font-bold tracking-normal">
              <CreditCard className="size-5 text-gold" />
              Forma de pagamento
            </h3>
            <p className="mt-2 text-sm text-text-muted sm:pl-8">{PAYMENT.methods.join(', ')}</p>
            <p className="mt-1 text-sm text-text-muted sm:pl-8">{paymentClaim()}.</p>

            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{serviceName}</dt>
                <dd className="tabular text-text">{money(servicePrice)}</dd>
              </div>
              {homeFee && (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Deslocação</dt>
                  <dd className="tabular text-text">{formatKz(PRICING.homeServiceFee)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 pt-2">
                <dt className="font-bold text-text">Total</dt>
                <dd className="tabular text-xl font-extrabold text-text">{money(total)}</dd>
              </div>
            </dl>

            {isFromPrice && (
              <p className="mt-3 text-sm text-text-muted">
                O valor exacto depende do barbeiro que o atender e aparece na
                confirmação.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="font-sans text-base font-bold tracking-normal">Os seus dados</h3>
        <p className="mt-1 text-sm text-text-muted">
          Para o barbeiro o poder contactar, e para encontrar o agendamento na sua conta.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
      </div>

      <PolicyNote />
    </div>
  );
}

/**
 * Ecrã final — "Agendamento confirmado!".
 *
 * Diz a verdade sobre o que falta: o agendamento está registado, mas a
 * confirmação do barbeiro acontece pelo WhatsApp. Por isso o botão principal
 * é o do WhatsApp, com a mensagem já escrita.
 */
export function BookingConfirmed({
  booking,
  barber,
}: {
  booking: Booking;
  barber: Barber | null;
}) {
  const place =
    booking.locationType === 'domicilio'
      ? { title: 'Morada', text: booking.address ?? '' }
      : { title: 'Barbearia', text: booking.barbershopName ?? barber?.area ?? '' };

  return (
    <div className="mx-auto max-w-4xl text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-gold text-gold">
        <Check className="size-8" />
      </span>

      <h2 className="mt-5 text-3xl sm:text-4xl">Agendamento confirmado!</h2>
      <p className="mx-auto mt-3 max-w-xl text-text-muted sm:text-lg">
        Já está registado. Falta só enviar a mensagem pelo WhatsApp, para a
        nossa equipa confirmar a disponibilidade com o barbeiro. Obrigado por
        escolher a Korte.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-left shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-center">
          <BarberBlock barber={barber} fallback={{ title: booking.barberName, subtitle: place.text }} />
          <ServiceBox
            name={booking.serviceName}
            durationMinutes={booking.durationMinutes}
            price={formatKz(booking.price)}
            priceNote={booking.locationType === 'domicilio' ? 'inclui deslocação' : undefined}
          />
        </div>

        <dl className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-3 sm:divide-x sm:divide-border">
          <div className="flex items-start gap-3">
            <CalendarIcon className="mt-0.5 size-6 shrink-0 text-gold" />
            <div>
              <dt className="text-sm text-text-muted">Data e hora</dt>
              <dd className="text-text">{dateLabel(booking.date)}</dd>
              <dd className="tabular font-bold text-text">{booking.time}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:pl-5">
            <MapPin className="mt-0.5 size-6 shrink-0 text-gold" />
            <div className="min-w-0">
              <dt className="text-sm text-text-muted">{place.title}</dt>
              <dd className="text-text">{place.text}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:pl-5">
            <CreditCard className="mt-0.5 size-6 shrink-0 text-gold" />
            <div>
              <dt className="text-sm text-text-muted">Forma de pagamento</dt>
              <dd className="text-text">{PAYMENT.methods.join(', ')}</dd>
            </div>
          </div>
        </dl>

        <PolicyNote className="mt-6" />
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-3">
        <a
          href={bookingWhatsappLink(booking)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-gold px-4 text-base font-bold sm:text-lg text-ink shadow-gold transition-transform hover:scale-[1.01]"
        >
          <WhatsApp className="size-6" />
          Confirmar pelo WhatsApp
          <ArrowRightIcon className="hidden size-5 sm:block" />
        </a>

        <Link
          href="/conta"
          className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-xl border border-gold bg-surface px-4 font-semibold text-text transition-colors hover:bg-selected"
        >
          <CalendarIcon className="size-5 text-gold" />
          Ver os meus agendamentos
          <ArrowRightIcon className="hidden size-5 sm:block" />
        </Link>

        <a
          href={generalWhatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 pt-2 text-sm text-text-muted hover:text-text"
        >
          <WhatsApp className="size-4" />
          Qualquer dúvida? Estamos disponíveis no WhatsApp.
        </a>
      </div>
    </div>
  );
}

/** "Corte + Barba · Degradê (Fade) + Desenhar barba" — o serviço por extenso. */
export function describeService(booking: Booking): string {
  const styles = [booking.styleName, booking.beardStyleName].filter(Boolean);
  return styles.length > 0 ? `${booking.serviceName} · ${styles.join(' + ')}` : booking.serviceName;
}
