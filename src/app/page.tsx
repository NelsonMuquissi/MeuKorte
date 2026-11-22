import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BarberCard } from '@/components/barbers/BarberCard';
import { Faq, type FaqItem } from '@/components/home/Faq';
import {
  Scissors, BarberCheck, CalendarClock, CalendarIcon, ShieldCheck, Clock, Home,
  Star, MapPin, Heart, ArrowRightIcon,
} from '@/components/ui/Icons';
import { getFeaturedBarbers } from '@/services/barbersService';
import {
  CANCELLATION, PAYMENT, PILOT_AREA, SERVICE_FORMATS, CLAIMS,
} from '@/config/business';

export const metadata: Metadata = {
  title: { absolute: 'Korte — o seu barbeiro, onde estiver' },
  description:
    'Cortes e barba com qualidade profissional, no conforto da sua casa ou no local da sua preferência. Escolha o barbeiro, escolha a hora, evite a fila. Em Luanda.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Korte — o seu barbeiro, onde estiver',
    description: 'Cortes e barba com qualidade profissional, onde estiver.',
    url: '/',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Korte.' }],
  },
};

/**
 * Página inicial — referências de Novembro de 2026 em `Novas_Referencias/`:
 * `Barber Landing Page Hero Design`, `Serviços de Barbearia MeuKorte`,
 * `Como Funciona_ Agendamento de Barbeiro` e `Meet Talatona's Best Barbers`.
 *
 * Superfície clara de cima a baixo. Server Component; só o acordeão do FAQ é
 * cliente. Os planos de assinatura e o banner "Mais do que um corte" saíram a
 * pedido do cliente.
 *
 * As duas jornadas separam-se na secção "Os nossos serviços", logo a seguir ao
 * herói: um card leva ao barbeiro em casa (`/agendar`), o outro ao salão
 * (`/salao`).
 */
export default async function HomePage() {
  const barbers = await getFeaturedBarbers(4);

  /**
   * Texto do cliente (`FAQS.txt`). Os números saem das regras de `business.ts`,
   * para não ficarem a mentir se as regras mudarem.
   */
  const faqItems: FaqItem[] = [
    {
      question: 'Cancelamentos e atrasos',
      answer: [
        `O cancelamento ou a alteração do agendamento pode ser solicitado até ${CANCELLATION.minHoursBefore} horas antes do horário marcado.`,
        'Após esse período, o barbeiro já reservou esse tempo exclusivamente para o seu atendimento. Por isso, qualquer situação deverá ser comunicada directamente à nossa equipa através do WhatsApp.',
        `Tolerância de atraso: concedemos uma tolerância máxima de ${CANCELLATION.lateToleranceMinutes} minutos. Após esse período, entre em contacto connosco para verificar a possibilidade de manter o atendimento.`,
      ],
    },
    {
      question: 'O barbeiro pode deslocar-se até minha casa?',
      answer: SERVICE_FORMATS.home
        ? [
            'Sim. A Korte disponibiliza atendimento ao domicílio nas zonas abrangidas pelo serviço. ' +
              'A deslocação tem uma taxa adicional, cujo valor é apresentado no total antes da confirmação da marcação.',
          ]
        : ['De momento o atendimento é só no salão.'],
    },
    {
      question: 'Quando devo efectuar o pagamento?',
      answer:
        PAYMENT.moment === 'on_service'
          ? [
              'O pagamento é efectuado no final do serviço, directamente ao barbeiro. ' +
                'Não é necessário efectuar qualquer pagamento antecipado para confirmar o agendamento.',
              'Métodos de pagamento aceites:',
            ]
          : ['O pagamento é efectuado no momento do agendamento.', 'Métodos de pagamento aceites:'],
      list: PAYMENT.methods,
    },
    {
      question: 'Quanto custa um corte?',
      answer: [
        'Os preços podem variar consoante o barbeiro e os serviços disponíveis. ' +
          'Consulte a tabela de preços no perfil de cada profissional antes de efectuar o agendamento.',
      ],
    },
    {
      question: 'Como recebo a confirmação da marcação?',
      answer: [
        'Após efectuar o agendamento, será redireccionado para o WhatsApp, com uma mensagem previamente preparada. ' +
          'Basta enviar a mensagem para que a nossa equipa possa confirmar a disponibilidade ou propor um horário alternativo.',
        'O agendamento ficará também registado na sua conta Korte.',
      ],
    },
  ];

  return (
    <>
      {/* ---- 1. HERÓI --------------------------------------------------- */}
      {/*
        Como em `Barber Landing Page Hero Design.png`: a fotografia ocupa a
        metade direita até à borda do ecrã, sem moldura. O fundo claro da foto
        é o creme da página (246,245,243 contra 247,245,242), por isso o lado
        esquerdo funde-se sem costura; a mancha dourada faz parte da foto,
        atrás do ombro. Um véu estreito à esquerda esconde a pouca diferença
        que resta.
      */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block">
          <Image
            src="/images/hero-principal.jpg"
            alt=""
            fill
            priority
            sizes="52vw"
            className="object-cover object-left-top"
          />
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:flex lg:min-h-[680px] lg:items-center lg:py-16">
          <div className="lg:max-w-[600px]">
            <h1 className="text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">
              O seu barbeiro,
              <br />
              <span className="text-accent">onde estiver.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg text-text-muted">
              Cortes e barba com qualidade profissional, no conforto da sua casa
              ou no local de preferência.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/agendar"
                className="inline-flex min-h-[56px] items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-gold px-7 text-base font-bold text-ink shadow-gold transition-transform hover:scale-[1.02]"
              >
                <CalendarIcon className="size-5" />
                Agendar agora
                <ArrowRightIcon className="size-5" />
              </Link>
              <Link
                href="/barbeiros"
                className="inline-flex min-h-[56px] items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border border-text/25 bg-surface px-7 text-base font-semibold text-text transition-colors hover:border-text/60"
              >
                <MapPin className="size-5" />
                Ver barbeiros perto de mim
              </Link>
            </div>

            {/* ---- Barra de confiança ----------------------------------- */}
            <ul className="mt-12 grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-border">
              {[
                { Icon: ShieldCheck, text: ['Profissionais', 'de confiança'] },
                { Icon: Clock, text: ['Agendamento', 'rápido e fácil'] },
                { Icon: Home, text: ['No local de', 'preferência'] },
                { Icon: Star, text: ['Qualidade', 'garantida'] },
              ].map(({ Icon, text }) => (
                <li key={text[0]} className="sm:px-5 sm:first:pl-0">
                  <Icon className="size-8 text-gold" />
                  <p className="mt-2 text-sm text-text-muted">
                    {text[0]}
                    <br />
                    {text[1]}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* No telemóvel a fotografia vem por baixo do texto, a toda a largura. */}
        <div className="relative mt-10 aspect-[856/743] lg:hidden">
          <Image
            src="/images/hero-principal.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* ---- 2. OS NOSSOS SERVIÇOS -------------------------------------- */}
      <section id="servicos" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_0.95fr]">
            <div className="lg:col-span-2">
              <h2 className="text-4xl sm:text-5xl">
                Os nossos <span className="text-accent">serviços</span>
              </h2>
              <p className="mt-3 max-w-lg text-lg text-text-muted">
                Agende quando precisar: o barbeiro vai até si, ou vai ao salão
                da sua confiança.
              </p>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <ServiceCard
                  photo="/images/servico-domicilio.jpg"
                  Icon={Home}
                  title="Corte no local de sua preferência"
                  text="O seu barbeiro vai até si, com todo o equipamento necessário, para um corte com qualidade profissional."
                  href="/agendar"
                  features={[
                    { Icon: ShieldCheck, label: 'Seguro e confiável' },
                    { Icon: Clock, label: 'Horário flexível' },
                    { Icon: MapPin, label: 'Onde estiver' },
                  ]}
                />
                <ServiceCard
                  photo="/images/servico-salao.jpg"
                  Icon={Scissors}
                  title="Corte no salão da sua confiança"
                  text="Desfrute de um serviço personalizado, num ambiente profissional e confortável."
                  href="/salao"
                  features={[
                    { Icon: BarberCheck, label: 'Profissionais certificados' },
                    { Icon: Star, label: 'Ambiente confortável' },
                    { Icon: MapPin, label: 'Vários salões' },
                  ]}
                />
              </div>
            </div>

            <TrustPanel />
          </div>
        </div>
      </section>

      {/* ---- 3. COMO FUNCIONA ------------------------------------------- */}
      {/*
        Como em `Como Funciona_ Agendamento de Barbeiro.png`: quatro passos
        numa linha, com setas entre eles, e à direita o telemóvel na mão a
        mostrar a confirmação, a desvanecer para o fundo. A imagem é a da
        referência, com o logótipo do ecrã trocado pelo "Korte.".
      */}
      <section id="como-funciona" className="relative scroll-mt-20 overflow-hidden border-t border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] lg:block"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 38%), linear-gradient(to top, transparent 0%, black 18%)',
            maskComposite: 'intersect',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 38%), linear-gradient(to top, transparent 0%, black 18%)',
            WebkitMaskComposite: 'source-in',
          }}
        >
          <Image
            src="/images/como-funciona.jpg"
            alt=""
            fill
            sizes="42vw"
            className="object-cover object-left"
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[640px] lg:pr-[300px]">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl">
            Como <span className="text-accent">funciona</span>
          </h2>
          <p className="mt-4 max-w-lg text-lg text-text-muted">
            Em poucos passos, escolha o serviço, o barbeiro e o horário.
            Rápido, simples e sem complicações.
          </p>

          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {[
              { Icon: Scissors, title: 'Escolha o serviço', text: 'Corte de cabelo, ou corte + barba.' },
              { Icon: MapPin, title: 'Seleccione o estilo', text: 'Degradê, taper, escovilho, ou descreva o seu.' },
              { Icon: BarberCheck, title: 'Marque o barbeiro', text: 'Confirme a disponibilidade e os detalhes do seu agendamento.' },
              { Icon: CalendarClock, title: 'Agende o horário', text: 'Receba a confirmação e esteja pronto para o seu corte.' },
            ].map(({ Icon, title, text }, i, all) => (
              <li key={title} className="relative">
                <span className="flex size-20 items-center justify-center rounded-full bg-icon-bg text-ink shadow-[0_6px_18px_rgb(199_145_74/0.22)] ring-1 ring-gold/25">
                  <Icon className="size-8" />
                </span>
                {/* Seta para o passo seguinte, só quando estão em linha. */}
                {i < all.length - 1 && (
                  <ArrowRightIcon
                    className="absolute right-1 top-7 hidden size-6 text-gold lg:block"
                  />
                )}
                <p className="mt-5 font-bold text-accent">Passo {i + 1}</p>
                <h3 className="mt-1 text-xl">{title}</h3>
                <p className="mt-2 text-text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* No telemóvel a imagem vem por baixo dos passos. */}
        <div
          className="relative mx-auto -mt-4 aspect-[642/742] max-w-sm lg:hidden"
          style={{
            maskImage: 'linear-gradient(to top, transparent 0%, black 20%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 20%)',
          }}
        >
          <Image src="/images/como-funciona.jpg" alt="" fill sizes="384px" className="object-cover" />
        </div>
      </section>

      {/* ---- 4. OS NOSSOS BARBEIROS ------------------------------------- */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl sm:text-5xl">
                Os nossos <span className="text-accent">barbeiros</span>
              </h2>
              <p className="mt-3 text-lg text-text-muted">
                Profissionais escolhidos a dedo para o arranque em {PILOT_AREA.district}.
              </p>
            </div>
            <Link
              href="/barbeiros"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-gold px-5 font-bold text-accent transition-colors hover:bg-selected"
            >
              Ver todos
              <ArrowRightIcon className="size-5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {barbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- 5. PERGUNTAS FREQUENTES ------------------------------------ */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-4xl sm:text-5xl">
            Perguntas <span className="text-accent">frequentes</span>
          </h2>
          <div className="mt-8">
            <Faq items={faqItems} />
          </div>
        </div>
      </section>
    </>
  );
}

type IconComponent = (p: { className?: string }) => React.ReactElement;

/** Card da secção "Os nossos serviços": fotografia, ícone, texto e CTA. */
function ServiceCard({
  photo,
  Icon,
  title,
  text,
  href,
  features,
}: {
  photo: string;
  Icon: IconComponent;
  title: string;
  text: string;
  href: string;
  features: { Icon: IconComponent; label: string }[];
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="relative aspect-[16/7]">
        <Image src={photo} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
        <span className="absolute left-4 top-4 flex size-14 items-center justify-center rounded-xl bg-gold text-ink">
          <Icon className="size-7" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl sm:text-2xl">{title}</h3>
        <p className="mt-2 flex-1 text-text-muted">{text}</p>

        <ul className="mt-5 grid grid-cols-3 divide-x divide-border border-y border-border py-3">
          {features.map(({ Icon: FeatureIcon, label }) => (
            <li key={label} className="flex flex-col items-center gap-1 px-1 text-center text-xs text-text-muted">
              <FeatureIcon className="size-5 text-gold" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <Link
            href={href}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 font-bold text-ink transition-transform hover:scale-[1.01]"
          >
            <CalendarIcon className="size-5" />
            Agendar agora
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** "Mais do que um corte, é confiança." — o painel à direita dos serviços. */
function TrustPanel() {
  const icons = [Star, ShieldCheck, Clock, Heart];

  return (
    <aside className="relative overflow-hidden rounded-xl border border-border bg-surface-2">
      <Image
        src="/images/servicos-destaque.jpg"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 380px"
        className="object-cover object-right opacity-70"
      />
      {/* Véu creme: o texto fica à esquerda, a fotografia respira à direita. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-bg from-60% to-bg/50"
      />

      <div className="relative p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Qualidade · Conveniência · Estilo
        </p>
        <h3 className="mt-4 text-2xl sm:text-3xl">
          Mais do que um corte, é <span className="text-accent">confiança</span>.
        </h3>
        <p className="mt-3 max-w-xs text-text-muted">
          Profissionais experientes, produtos de qualidade e um serviço pensado
          para si.
        </p>

        <ul className="mt-7 space-y-5">
          {CLAIMS.trustPanel.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <li key={item.title} className="flex items-start gap-4">
                <Icon className="size-7 shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-bold text-text">{item.title}</p>
                  <p className="text-sm text-text-muted">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 -rotate-3 font-serif text-2xl italic text-accent">Sempre consigo</p>
      </div>
    </aside>
  );
}
