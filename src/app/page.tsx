import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { BarberCard } from '@/components/barbers/BarberCard';
import { Faq, type FaqItem } from '@/components/home/Faq';
import {
  Scissors, Crown, BarberCheck, CalendarClock, HomePin, ShieldCard,
  Sparkle, Clock, Badge, Star, Check,
} from '@/components/ui/Icons';
import { getFeaturedBarbers } from '@/services/barbersService';
import { formatKz } from '@/lib/format';
import { generalWhatsappLink } from '@/lib/whatsapp';
import {
  SINGLE_CUT, SUBSCRIPTION_PLANS, PRICING, CANCELLATION,
  PAYMENT, PILOT_AREA, SERVICE_FORMATS,
} from '@/config/business';

export const metadata: Metadata = {
  title: { absolute: 'Meu Korte — o teu barbeiro, onde estiveres' },
  description:
    'Cortes, barba e estilo com qualidade profissional, no conforto da tua casa ou no salão. Escolhe o barbeiro, escolhe a hora, evita a fila. Em Luanda.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Meu Korte — o teu barbeiro, onde estiveres',
    description: 'Cortes, barba e estilo com qualidade profissional, onde quiseres.',
    url: '/',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Meu Korte' }],
  },
};

/**
 * Página inicial — secção 1 do template 2 (docs/template/image3.jpeg).
 *
 * Superfície escura de cima a baixo. Server Component; só o acordeão do FAQ
 * é cliente.
 */
export default async function HomePage() {
  const barbers = await getFeaturedBarbers(4);

  /** As respostas saem das regras de `business.ts`, para não ficarem a mentir. */
  const faqItems: FaqItem[] = [
    {
      question: 'Posso cancelar um agendamento?',
      answer:
        `Podes, até ${CANCELLATION.minHoursBefore} horas antes da hora marcada, ` +
        'na tua conta. Depois disso o barbeiro já reservou o tempo para ti, por ' +
        'isso pedimos que fales connosco pelo WhatsApp. Há uma tolerância de ' +
        `${CANCELLATION.lateToleranceMinutes} minutos de atraso.`,
    },
    {
      question: 'O barbeiro vai a minha casa?',
      answer: SERVICE_FORMATS.home
        ? `Vai, nas zonas onde estamos a trabalhar: ${PILOT_AREA.homeServiceAreas.join(', ')}. ` +
          `A deslocação tem uma taxa de ${formatKz(PRICING.homeServiceFee)}, que aparece ` +
          'somada no total antes de confirmares. Nem todos os barbeiros fazem ' +
          'domicílio — vês isso no perfil de cada um.'
        : 'De momento o atendimento é só no salão.',
    },
    {
      question: 'Quando é que pago?',
      answer:
        PAYMENT.moment === 'on_service'
          ? 'Pagas no fim do serviço, directamente ao barbeiro. Não pedimos nada ' +
            `adiantado para agendar. Métodos aceites: ${PAYMENT.methods.join(', ')}.`
          : 'O pagamento é feito no momento do agendamento. ' +
            `Métodos aceites: ${PAYMENT.methods.join(', ')}.`,
    },
    {
      question: 'Quanto custa um corte?',
      answer:
        `Um corte está em ${formatKz(PRICING.standardCut)} e corte com barba em ` +
        `${formatKz(PRICING.cutAndBeard)}. Cada barbeiro tem a sua tabela, que vês no ` +
        'perfil antes de agendares. Se cortas todas as semanas, a assinatura sai mais em conta.',
    },
    {
      question: 'Como recebo a confirmação?',
      answer:
        'Depois de agendares, és levado para o WhatsApp com a mensagem já escrita. ' +
        'Envias, e o barbeiro confirma ou propõe outra hora. O agendamento fica ' +
        'guardado na tua conta.',
    },
  ];

  return (
    <>
      {/* ---- 1. HERO ---------------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink">
        {/* Fotografia: ocupa a direita no desktop e todo o fundo no telemóvel. */}
        <div className="absolute inset-0 lg:left-[38%]">
          <Image
            src="/images/hero.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 62vw"
            className="object-cover object-center"
          />
          {/* Gradiente que garante contraste do texto por cima da foto. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40 lg:from-ink lg:via-ink/70 lg:to-transparent"
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <div className="max-w-xl">
            <h1 className="text-[2.75rem] leading-[1.05] sm:text-6xl">
              O teu barbeiro,
              <br />
              <span className="text-gold">onde estiveres.</span>
            </h1>

            <p className="mt-5 max-w-md text-lg text-text-muted">
              Cortes, barba e estilo, com qualidade profissional, no conforto da
              tua casa, no teu trabalho ou onde quiseres.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/marcar" variant="gold" size="lg">
                Agendar agora
              </ButtonLink>
              <ButtonLink href="#planos" variant="outline" size="lg">
                Ver planos de assinatura
              </ButtonLink>
            </div>
          </div>

          {/* ---- 2. Barra de confiança ---------------------------------- */}
          <ul className="mt-14 grid gap-5 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: BarberCheck, title: 'Barbeiros profissionais', text: 'Seleccionados e verificados' },
              { Icon: CalendarClock, title: 'Agendamento online', text: 'Marcas em menos de um minuto' },
              { Icon: HomePin, title: 'Serviço ao domicílio', text: 'Em tua casa ou no salão' },
              { Icon: ShieldCard, title: 'Pagamento seguro', text: 'Só pagas depois do corte' },
            ].map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-6 shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-bold text-text">{title}</p>
                  <p className="text-sm text-text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- 3. OS NOSSOS SERVIÇOS -------------------------------------- */}
      <section id="servicos" className="scroll-mt-20 border-t border-white/10 bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <h2 className="text-3xl sm:text-4xl">Os nossos serviços</h2>
              <p className="mt-2 max-w-md text-text-muted">
                Corta quando precisares, ou assina e tem o cabelo sempre em dia.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <ServiceCard
                  Icon={Crown}
                  title="Assinatura"
                  text="Mantém-te sempre em ordem. Cortes mensais, por um valor fixo e mais em conta."
                  href="#planos"
                  cta="Ver planos"
                />
                <ServiceCard
                  Icon={Scissors}
                  title="Corte único"
                  text={SINGLE_CUT.description}
                  href="/marcar"
                  cta="Agendar agora"
                />
              </div>
            </div>

            {/* Painel fotográfico com as três palavras do template. */}
            <div className="relative min-h-[260px] overflow-hidden rounded-lg lg:min-h-full">
              <Image
                src="/images/servicos-destaque.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 380px"
                className="object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <ul className="absolute bottom-5 left-5 space-y-1">
                {['Qualidade', 'Conveniência', 'Estilo'].map((w) => (
                  <li key={w} className="text-xl font-extrabold text-white">{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 4. COMO FUNCIONA ------------------------------------------- */}
      <section id="como-funciona" className="relative scroll-mt-20 overflow-hidden">
        <Image
          src="/images/como-funciona-fundo.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/88" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Como funciona</h2>
          <p className="mt-2 text-text-muted">Quatro passos, menos de um minuto.</p>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Scissors, title: 'Escolhe o serviço', text: 'Corte, ou corte com barba.' },
              { Icon: Sparkle, title: 'Selecciona o estilo', text: 'Degradê, clássico, afro e mais.' },
              { Icon: BarberCheck, title: 'Marca o barbeiro', text: 'Vê avaliações e experiência.' },
              { Icon: CalendarClock, title: 'Agenda o horário', text: 'Só aparecem as horas livres.' },
            ].map(({ Icon, title, text }, i) => (
              <li key={title} className="relative">
                <span className="flex size-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                  <Icon className="size-6" />
                </span>
                <p className="mt-4 text-sm font-bold text-gold">
                  Passo {i + 1}
                </p>
                <h3 className="mt-1 text-xl">{title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{text}</p>
              </li>
            ))}
          </ol>

          <ButtonLink href="/marcar" variant="gold" size="lg" className="mt-10">
            Começar agora
          </ButtonLink>
        </div>
      </section>

      {/* ---- 5. BARBEIROS ------------------------------------------------ */}
      <section className="border-t border-white/10 bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl">Os nossos barbeiros</h2>
              <p className="mt-2 text-text-muted">
                Profissionais escolhidos a dedo para o arranque em {PILOT_AREA.district}.
              </p>
            </div>
            <ButtonLink href="/barbeiros" variant="secondary" size="sm">
              Ver todos
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- 6. PLANOS DE ASSINATURA ------------------------------------ */}
      <section id="planos" className="scroll-mt-20 border-t border-white/10 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">
            Planos de assinatura
          </p>
          <h2 className="mt-3 max-w-lg text-3xl sm:text-4xl">
            Cabelo sempre em dia. Com mais vantagens.
          </h2>
          <p className="mt-3 max-w-md text-text-muted">
            Escolhe o plano que combina contigo. Cancelas quando quiseres.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-lg border p-6 ${
                  plan.highlighted
                    ? 'border-gold bg-gold/[0.07] shadow-gold lg:-mt-3 lg:pb-9'
                    : 'border-border bg-bg'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-ink">
                    Mais popular
                  </span>
                )}

                <h3 className="text-2xl">{plan.name}</h3>
                <p className="mt-1 text-sm text-text-muted">{plan.cutsLabel}</p>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="tabular text-4xl font-extrabold text-gold">
                    {formatKz(plan.price)}
                  </span>
                  <span className="text-sm text-text-muted">/{plan.period}</span>
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm text-text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={generalWhatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant={plan.highlighted ? 'gold' : 'secondary'}
                  className="mt-7"
                >
                  Assinar
                </ButtonLink>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-text-muted">
            Preços de arranque, sujeitos a confirmação durante o período de teste.
          </p>
        </div>
      </section>

      {/* ---- 7. FAQ ------------------------------------------------------ */}
      <section className="border-t border-white/10 bg-bg">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Perguntas frequentes</h2>
          <div className="mt-8">
            <Faq items={faqItems} />
          </div>
        </div>
      </section>

      {/* ---- 8. BANNER FINAL --------------------------------------------- */}
      <section className="relative overflow-hidden">
        <Image src="/images/confianca.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/85" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl">
                Mais do que um corte.
                <br />
                <span className="text-gold">É confiança.</span>
              </h2>
              <p className="mt-4 max-w-md text-text-muted">
                O mesmo barbeiro, o mesmo cuidado, sempre que precisares.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/marcar" variant="gold" size="lg">
                  Agendar agora
                </ButtonLink>
                <a
                  href={generalWhatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-md border border-white/25 px-7 font-bold text-white transition-colors hover:border-white/60"
                >
                  Falar pelo WhatsApp
                </a>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-2">
              {[
                { Icon: Sparkle, label: 'Estilo' },
                { Icon: Clock, label: 'Pontualidade' },
                { Icon: Badge, label: 'Profissionalismo' },
                { Icon: Star, label: 'Satisfação' },
              ].map(({ Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2 text-center lg:flex-row lg:text-left">
                  <span className="flex size-14 items-center justify-center rounded-full border border-gold/40 text-gold">
                    <Icon className="size-6" />
                  </span>
                  <span className="text-sm font-bold text-text">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

/** Card da secção "Os nossos serviços". */
function ServiceCard({
  Icon,
  title,
  text,
  href,
  cta,
}: {
  Icon: (p: { className?: string }) => React.ReactElement;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="group relative flex flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-gold/50">
      <span className="flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-text-muted">{text}</p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold after:absolute after:inset-0 after:content-['']"
      >
        {cta}
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}
