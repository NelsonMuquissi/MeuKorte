import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BarberCard } from '@/components/barbers/BarberCard';
import { Faq, type FaqItem } from '@/components/home/Faq';
import { getFeaturedBarbers } from '@/services/barbersService';
import { formatKz } from '@/lib/format';
import { generalWhatsappLink } from '@/lib/whatsapp';
import {
  PLANS,
  PRICING,
  CANCELLATION,
  PAYMENT,
  PILOT_AREA,
  SERVICE_FORMATS,
} from '@/config/business';

export const metadata: Metadata = {
  // O `template` do layout acrescenta "· Meu Korte"; na inicial não queremos isso.
  title: { absolute: 'Meu Korte — marca o teu corte em Luanda' },
  description:
    'Escolhe o barbeiro, escolhe a hora, evita a fila. Corte no salão ou em tua casa, em Luanda. Marca em menos de um minuto.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Meu Korte — marca o teu corte em Luanda',
    description: 'Escolhe o barbeiro, escolhe a hora, evita a fila.',
    url: '/',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Meu Korte' }],
  },
};

/**
 * Página inicial.
 *
 * É a página que recebe o tráfego do Instagram e do TikTok, por isso tudo nela
 * aponta para o mesmo sítio: marcar. Server Component — só o acordeão do FAQ é
 * cliente.
 */
export default async function HomePage() {
  const barbers = await getFeaturedBarbers(4);

  /**
   * As respostas do FAQ são montadas a partir das regras de `business.ts`.
   * Quando uma regra mudar, o texto muda sozinho e não fica a mentir ao cliente.
   */
  const faqItems: FaqItem[] = [
    {
      question: 'Posso cancelar uma marcação?',
      answer:
        `Podes, até ${CANCELLATION.minHoursBefore} horas antes da hora marcada, ` +
        'directamente na página "As minhas marcações". Depois disso o barbeiro já ' +
        'reservou o tempo para ti, por isso pedimos que fales connosco pelo WhatsApp. ' +
        `Há uma tolerância de ${CANCELLATION.lateToleranceMinutes} minutos de atraso.`,
    },
    {
      question: 'O barbeiro vai a minha casa?',
      answer: SERVICE_FORMATS.home
        ? `Vai, nas zonas onde estamos a trabalhar: ${PILOT_AREA.homeServiceAreas.join(', ')}. ` +
          `O atendimento ao domicílio tem uma taxa de deslocação de ${formatKz(PRICING.homeServiceFee)}, ` +
          'que já aparece somada no total antes de confirmares. Nem todos os barbeiros ' +
          'fazem domicílio — vês isso no perfil de cada um.'
        : 'De momento o atendimento é só no salão.',
    },
    {
      question: 'Quando é que pago?',
      answer:
        PAYMENT.moment === 'on_service'
          ? 'Pagas no fim do serviço, directamente ao barbeiro. Não pedimos nada ' +
            `adiantado para marcar. Métodos aceites: ${PAYMENT.methods.join(', ')}.`
          : 'O pagamento é feito no momento da marcação, para garantir o horário. ' +
            `Métodos aceites: ${PAYMENT.methods.join(', ')}.`,
    },
    {
      question: 'Quanto custa um corte?',
      answer:
        `Um corte normal está em ${formatKz(PRICING.standardCut)} e corte com barba em ` +
        `${formatKz(PRICING.cutAndBeard)}. Cada barbeiro tem a sua tabela, que podes ver ` +
        'no perfil antes de marcares. Se cortas todas as semanas, a subscrição de ' +
        'membro sai mais em conta.',
    },
    {
      question: 'Como recebo a confirmação?',
      answer:
        'Depois de marcares, és levado para o WhatsApp com a mensagem já escrita. ' +
        'Envias, e o barbeiro confirma ou propõe outra hora. A marcação fica ' +
        'guardada na página "As minhas marcações".',
    },
  ];

  return (
    <>
      {/* ---- 1. Hero ---------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Brilho dourado atrás do título. Decorativo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {PILOT_AREA.district}, {PILOT_AREA.city}
            </p>

            <h1 className="mt-5 text-5xl leading-[0.95] sm:text-7xl">
              O teu corte,
              <br />
              <span className="text-primary">à tua hora.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-text-muted">
              Escolhe o barbeiro que quiseres, marca a hora que te der jeito e
              aparece sem esperar. No salão ou em tua casa.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/marcar" size="lg">
                Marcar corte
              </ButtonLink>
              <ButtonLink href="/barbeiros" size="lg" variant="secondary">
                Ver barbeiros
              </ButtonLink>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <dt className="text-sm text-text-muted">Marcas em</dt>
                <dd className="font-display text-3xl text-text">1 minuto</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Fila de espera</dt>
                <dd className="font-display text-3xl text-text">Zero</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">A partir de</dt>
                <dd className="tabular font-display text-3xl text-primary">
                  {formatKz(PRICING.lineUp)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ---- 2. Problema → solução -------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-3xl sm:text-4xl">Porquê o Meu Korte</h2>
        <p className="mt-2 max-w-xl text-text-muted">
          Cortar o cabelo não devia custar meia tarde.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              problem: 'Chegas e tens de esperar',
              solution: 'Marcas a hora e és atendido à hora',
              detail:
                'Sem sentar no banco à espera da tua vez. O barbeiro já sabe que vens.',
            },
            {
              problem: 'Calha-te o barbeiro que estiver livre',
              solution: 'Escolhes o barbeiro',
              detail:
                'Vês o trabalho de cada um, as especialidades e as avaliações antes de marcares.',
            },
            {
              problem: 'Tens de sair de casa',
              solution: 'O barbeiro pode ir ter contigo',
              detail:
                'Nas zonas onde trabalhamos, cortas em casa, com o material do profissional.',
            },
          ].map((item) => (
            <Card key={item.solution} className="p-5">
              <p className="flex items-center gap-2 text-sm text-text-muted line-through decoration-cancelled/60">
                {item.problem}
              </p>
              <h3 className="mt-2 text-xl text-primary">{item.solution}</h3>
              <p className="mt-2 text-sm text-text-muted">{item.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- 3. Como funciona ------------------------------------------- */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Como funciona</h2>

          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Escolhes o barbeiro', text: 'Vês os perfis, os preços e as avaliações.' },
              { title: 'Escolhes serviço e hora', text: 'Só aparecem as horas que estão mesmo livres.' },
              { title: 'Confirmas pelo WhatsApp', text: 'A mensagem já vai escrita. É só enviar.' },
              { title: 'Cortas e avalias', text: 'No fim, dizes como correu. Ajuda os próximos.' },
            ].map((step, index) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden="true"
                  className="font-display text-5xl text-primary/30"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 text-xl">{step.title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- 4. Barbeiros em destaque ----------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
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
          {barbers.map((barber, index) => (
            // Só a primeira imagem leva `priority`: é a única que costuma entrar
            // no primeiro ecrã em alguns tamanhos.
            <BarberCard key={barber.id} barber={barber} priority={index === 0} />
          ))}
        </div>
      </section>

      {/* ---- 5. Planos --------------------------------------------------- */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Quanto custa</h2>
          <p className="mt-2 max-w-xl text-text-muted">
            Paga só o corte que deres, ou passa a membro se cortas sempre.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            {[PLANS.single, PLANS.member].map((plan) => (
              <Card key={plan.id} highlighted={plan.highlighted} className="relative flex flex-col p-6">
                {plan.highlighted && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-ink">
                    Mais vantajoso
                  </span>
                )}

                <h3 className="text-2xl">{plan.name}</h3>
                <p className="mt-1 text-sm text-text-muted">{plan.description}</p>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="tabular font-display text-4xl text-primary">
                    {formatKz(plan.price)}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-text-muted">/{plan.period}</span>
                  )}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm text-text-muted">
                      <svg
                        viewBox="0 0 20 20"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      >
                        <path
                          d="m4 10.5 4 4 8-9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={plan.id === 'membro' ? generalWhatsappLink() : '/marcar'}
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  className="mt-6"
                  {...(plan.id === 'membro'
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {plan.id === 'membro' ? 'Falar connosco' : 'Marcar corte'}
                </ButtonLink>
              </Card>
            ))}
          </div>

          <p className="mt-5 text-xs text-text-muted">
            Preços de arranque, sujeitos a confirmação durante o período de teste.
          </p>
        </div>
      </section>

      {/* ---- 6. Perguntas frequentes ------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-3xl sm:text-4xl">Perguntas frequentes</h2>
        <div className="mt-8">
          <Faq items={faqItems} />
        </div>
      </section>

      {/* ---- 7. Chamada final ------------------------------------------- */}
      <section className="border-t border-border bg-surface">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 size-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl">Pronto para o próximo corte?</h2>
            <p className="mx-auto mt-4 max-w-md text-text-muted">
              Leva menos de um minuto. Escolhes o barbeiro, escolhes a hora, e está feito.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/marcar" size="lg">
                Marcar corte
              </ButtonLink>
              <a
                href={generalWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md border border-border bg-surface-2 px-7 text-lg font-semibold text-text transition-colors hover:border-primary-dim hover:text-primary"
              >
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
