/**
 * Configuração de negócio do Meu Korte.
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

/** Planos de receita: corte avulso e subscrição de membro. */
export const PLANS = {
  single: {
    id: 'avulso',
    name: 'Corte avulso',
    price: PRICING.standardCut, // PROVISÓRIO — confirmar
    period: null,
    description: 'Marcas quando precisas, pagas só esse corte.',
    features: [
      'Escolhes o barbeiro e o horário',
      'Sem filas de espera',
      'Atendimento no salão ou ao domicílio',
      'Avalias o serviço no fim',
    ],
    highlighted: false,
  },
  member: {
    id: 'membro',
    name: 'Membro Meu Korte',
    price: 18000, // PROVISÓRIO — confirmar
    period: 'mês',
    /** Cortes incluídos por mês na subscrição. */
    includedCuts: 4, // PROVISÓRIO — confirmar
    description: 'Para quem corta todas as semanas.',
    features: [
      '4 cortes por mês incluídos',
      'Prioridade na marcação de horários',
      'Taxa de deslocação sem custo',
      'Barba incluída uma vez por mês',
    ],
    highlighted: true,
  },
} as const;

/** Comissão retida pela plataforma sobre cada marcação. */
export const COMMISSION = {
  /** Percentagem sobre o valor do serviço (0.15 = 15%). */
  rate: 0.15, // PROVISÓRIO — confirmar: comissão, subscrição ou ambos?
} as const;

/** Momento em que o cliente paga. */
export const PAYMENT = {
  /** `on_service` = paga no fim do serviço; `on_booking` = paga ao marcar. */
  moment: 'on_service' as 'on_service' | 'on_booking', // PROVISÓRIO — confirmar
  /** Métodos aceites, por ordem de apresentação. */
  methods: ['Multicaixa Express', 'Transferência', 'Numerário'], // PROVISÓRIO — confirmar
} as const;

/** Regras de cancelamento, atrasos e faltas. */
export const CANCELLATION = {
  /** Antecedência mínima, em horas, para cancelar sem penalização. */
  minHoursBefore: 2, // PROVISÓRIO — confirmar
  /** Tolerância de atraso, em minutos, antes de a marcação ser dada como falta. */
  lateToleranceMinutes: 15, // PROVISÓRIO — confirmar
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

/** Antecedência mínima, em horas, entre o momento actual e a marcação. */
export const MIN_BOOKING_NOTICE_HOURS = 1; // PROVISÓRIO — confirmar

/** Número de dias para a frente que o cliente pode marcar. */
export const BOOKING_WINDOW_DAYS = 30; // PROVISÓRIO — confirmar
