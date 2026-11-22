/**
 * Configuração de negócio da Korte.
 *
 * Este ficheiro é a ÚNICA fonte de preços, taxas, regras e contactos.
 * Nunca escrever estes valores directamente nos componentes.
 *
 * Tudo o que está marcado com `// PROVISÓRIO — confirmar` corresponde a uma decisão
 * ainda em aberto no plano do MVP (secção 8 do Plano_MVP_Meu_Korte.docx) e tem de ser
 * confirmado com o negócio antes do lançamento. O README lista-os todos.
 */

/** Zona piloto do teste de 90 dias. */
export const PILOT_AREA = {
  city: 'Luanda',
  district: 'Talatona', // PROVISÓRIO — confirmar: a zona piloto ainda não foi escolhida
  /** Zonas onde há atendimento ao domicílio durante o piloto. */
  homeServiceAreas: [
    'Talatona',
    'Benfica',
    'Camama',
    'Kilamba',
    'Morro Bento',
  ], // PROVISÓRIO — confirmar
} as const;

/** Formatos de atendimento oferecidos na plataforma. */
export const SERVICE_FORMATS = {
  /** O serviço é feito no salão do barbeiro. */
  salon: true, // PROVISÓRIO — confirmar: salão, domicílio ou ambos?
  /** O barbeiro desloca-se a casa do cliente. */
  home: true, // PROVISÓRIO — confirmar
} as const;

/**
 * Tabela de preços base, em Kwanzas.
 * Os serviços de cada barbeiro em `src/data/barbers.ts` referenciam estes valores.
 */
export const PRICING = {
  /** Corte normal — referência de preço da plataforma. */
  standardCut: 5000, // PROVISÓRIO — confirmar
  /** Corte + barba. */
  cutAndBeard: 7500, // PROVISÓRIO — confirmar
  /** Apenas barba. */
  beard: 3000, // PROVISÓRIO — confirmar
  /** Corte infantil. */
  kidsCut: 4000, // PROVISÓRIO — confirmar
  /** Acabamento / retoque entre cortes. */
  lineUp: 2500, // PROVISÓRIO — confirmar
  /** Taxa fixa acrescentada quando o atendimento é ao domicílio. */
  homeServiceFee: 2500, // PROVISÓRIO — confirmar: haverá taxa de deslocação?
} as const;

/**
 * Os dois serviços que abrem o fluxo de agendamento.
 *
 * O primeiro passo é escolher o serviço — antes do barbeiro. Por isso o serviço
 * tem de existir independentemente de quem o presta: o preço aqui é o de
 * referência ("Desde X Kz") e o preço real vem do barbeiro escolhido.
 *
 * `included` é o texto do cliente (Novembro de 2026), palavra por palavra.
 */
export const BOOKABLE_SERVICES = [
  {
    type: 'corte' as const,
    name: 'Corte de cabelo',
    description: 'Um corte bem feito realça o seu estilo e faz toda a diferença.',
    photo: '/images/servico-corte.jpg',
    fromPrice: PRICING.standardCut, // PROVISÓRIO — confirmar
    includesBeard: false,
    included: [
      'Corte e acabamento profissional',
      'Taxa de deslocação, caso opte pelo atendimento ao domicílio (apresentada no valor total antes da confirmação)',
    ],
  },
  {
    type: 'corte-barba' as const,
    name: 'Corte + Barba',
    description: 'O cuidado completo para um visual mais definido e confiante.',
    photo: '/images/servico-corte-barba.jpg',
    fromPrice: PRICING.cutAndBeard, // PROVISÓRIO — confirmar
    includesBeard: true,
    included: [
      'Corte e acabamento profissional',
      'Modelação da barba',
      'Finalização com produtos de qualidade profissional',
      'Deslocação do barbeiro, caso opte pelo atendimento ao domicílio. O respectivo valor será incluído no total antes da confirmação do agendamento',
    ],
  },
] as const;

/*
 * Os planos de assinatura e o "corte único" saíram da página inicial a pedido
 * do cliente (Novembro de 2026). A subscrição continua a ser uma fonte de
 * receita prevista no plano do MVP; quando voltar, volta aqui.
 */

/** Comissão retida pela plataforma sobre cado agendamento. */
export const COMMISSION = {
  /** Percentagem sobre o valor do serviço (0.15 = 15%). */
  rate: 0.15, // PROVISÓRIO — confirmar: comissão, subscrição ou ambos?
} as const;

/** Momento em que o cliente paga. */
export const PAYMENT = {
  /** `on_service` = paga no fim do serviço; `on_booking` = paga ao agendar. */
  moment: 'on_service' as 'on_service' | 'on_booking', // CONFIRMADO — FAQ do cliente, Nov 2026
  /** Métodos aceites, por ordem de apresentação. */
  methods: ['Multicaixa Express', 'Transferência bancária', 'Numerário'], // CONFIRMADO — FAQ do cliente, Nov 2026
} as const;

/** Regras de cancelamento, atrasos e faltas. */
export const CANCELLATION = {
  /** Antecedência mínima, em horas, para cancelar ou alterar. */
  minHoursBefore: 6, // CONFIRMADO — FAQ do cliente, Nov 2026
  /** Tolerância de atraso, em minutos. */
  lateToleranceMinutes: 15, // CONFIRMADO — FAQ do cliente, Nov 2026
  /** Há penalização por falta sem aviso? */
  noShowPenalty: false, // PROVISÓRIO — confirmar
} as const;

/** Contactos da plataforma. */
export const CONTACT = {
  /** Número do WhatsApp Business, em formato internacional sem `+` (para o wa.me). */
  whatsappNumber: '244936327119', // CONFIRMADO
  /** O mesmo número, formatado para leitura. */
  whatsappDisplay: '+244 936 327 119', // CONFIRMADO
  email: 'ola@meukorte.ao', // PROVISÓRIO — confirmar
  instagram: 'meukorte', // PROVISÓRIO — confirmar
  tiktok: 'meukorte', // PROVISÓRIO — confirmar
} as const;

/**
 * PIN dos painéis de demonstração (`/painel-barbeiro` e `/admin`).
 *
 * ⚠️ ISTO NÃO É SEGURANÇA. O PIN está no código que corre no navegador e qualquer
 * pessoa o consegue ler. Só serve para esconder as demonstrações de visitantes casuais
 * enquanto não existe autenticação a sério no Django. Nunca colocar aqui dados reais
 * de clientes.
 */
export const DEMO_PIN = '2024'; // PROVISÓRIO — substituir por autenticação Django

/**
 * Afirmações feitas ao cliente na interface.
 *
 * Tudo o que aqui está é uma PROMESSA. Se o texto disser que o pagamento é no
 * fim e a regra mudar, o site passa a mentir — por isso as frases vivem aqui,
 * ao lado das regras de que dependem, e não espalhadas pelos componentes.
 *
 * Nenhuma destas frases pode prometer um tempo de execução: o fluxo tem seis
 * passos e não há medição nenhuma que sustente "em menos de um minuto".
 */
export const CLAIMS = {
  /**
   * Existe mesmo um processo de selecção e verificação dos barbeiros?
   *
   * Com `false`, a interface deixa de o afirmar e passa a descrever apenas o
   * que é verdade. Não afirmar é melhor do que afirmar sem processo montado.
   */
  barbersVerified: true, // PROVISÓRIO — confirmar: há processo de verificação?
  barbersVerifiedText: 'Seleccionados e verificados', // PROVISÓRIO — confirmar
  /** Usado quando não há processo de verificação. */
  barbersFallbackText: 'Profissionais parceiros em Luanda',

  /** Agendamento. Descreve o que o cliente faz, sem prometer tempo. */
  bookingText: 'Escolha o barbeiro, o estilo e a hora', // PROVISÓRIO — confirmar

  /** Deslocação ao domicílio. */
  homeServiceText: 'Em sua casa ou no salão', // PROVISÓRIO — confirmar

  /**
   * Pagamento. O texto segue `PAYMENT.moment` — ver `paymentClaim()` abaixo,
   * que é o que a interface deve usar.
   */
  paymentOnServiceText: 'O pagamento é efectuado no final do serviço, directamente ao barbeiro', // PROVISÓRIO — confirmar
  paymentOnBookingText: 'O pagamento é efectuado no momento do agendamento', // PROVISÓRIO — confirmar

  /**
   * Painel "Mais do que um corte, é confiança." da secção de serviços.
   * Texto do cliente (`Serviços de Barbearia MeuKorte.png`). A higiene é uma
   * promessa concreta: só fica se for verdade em todos os barbeiros.
   */
  trustPanel: [
    { title: 'Profissionais de confiança', text: 'Barbeiros experientes e certificados' }, // PROVISÓRIO — confirmar
    { title: 'Higiene e segurança', text: 'Todos os equipamentos são esterilizados' }, // PROVISÓRIO — confirmar
    { title: 'Atendimento rápido', text: 'No seu tempo, sem complicações' },
    { title: 'Estilo ao seu alcance', text: 'Corte, barba e muito mais' },
  ],
} as const;

/** A frase de pagamento certa para a regra actualmente em vigor. */
export function paymentClaim(): string {
  return PAYMENT.moment === 'on_service'
    ? CLAIMS.paymentOnServiceText
    : CLAIMS.paymentOnBookingText;
}

/** A frase sobre os barbeiros, consoante exista ou não verificação. */
export function barbersClaim(): string {
  return CLAIMS.barbersVerified
    ? CLAIMS.barbersVerifiedText
    : CLAIMS.barbersFallbackText;
}

/** Metas de validação do MVP, usadas nos indicadores do /admin. */
export const MVP_GOALS = {
  barbers: 4,
  users: 100,
  bookings: 25,
  /** Taxa de satisfação alvo (0.9 = 90%). */
  satisfactionRate: 0.9,
  testPeriodDays: 90,
} as const;

/** Duração, em minutos, de cada intervalo da grelha de horários. */
export const SLOT_INTERVAL_MINUTES = 30; // PROVISÓRIO — confirmar

/** Antecedência mínima, em horas, entre o momento actual e o agendamento. */
export const MIN_BOOKING_NOTICE_HOURS = 1; // PROVISÓRIO — confirmar

/** Número de dias para a frente que o cliente pode agendar. */
export const BOOKING_WINDOW_DAYS = 30; // PROVISÓRIO — confirmar
