/**
 * Contrato de dados do Meu Korte.
 *
 * Estes tipos definem o formato da futura API Django + DRF. Quando o backend
 * existir, os serviços em `src/services/` passam a devolver estes mesmos tipos a
 * partir de `fetch`, e nada mais na aplicação precisa de mudar.
 *
 * Convenções que acompanham o DRF:
 *  - datas em ISO 8601 (`YYYY-MM-DD`), horas em `HH:mm` (24h);
 *  - identificadores em `string`, para aceitarem UUID mais tarde;
 *  - valores monetários em Kwanzas, como número inteiro (sem cêntimos).
 */

/** Onde o serviço é prestado. */
export type LocationType = 'salao' | 'domicilio';

/**
 * Tipo de serviço, independente do barbeiro.
 *
 * O fluxo escolhe primeiro o SERVIÇO e só depois o barbeiro, por isso é preciso
 * um identificador comum: o cliente escolhe "Corte + Barba" e, quando escolher
 * o barbeiro, é este tipo que encontra o serviço concreto desse profissional.
 */
export type ServiceType = 'corte' | 'corte-barba' | 'barba' | 'infantil' | 'retoque';

/** Um estilo é de corte ou de barba. */
export type StyleCategory = 'corte' | 'barba';

/** Ciclo de vida de um agendamento, tal como no fluxo do plano do MVP. */
export type BookingStatus = 'pendente' | 'confirmada' | 'concluida' | 'cancelada';

/** Dia da semana. 0 = domingo, 6 = sábado (igual ao `Date.getDay()`). */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Um estilo de corte ou de barba, escolhido no passo 2 do fluxo. */
export interface Style {
  id: string;
  name: string;
  /** Uma linha, no máximo — aparece por baixo do nome no card. */
  description: string;
  /** Caminho a partir de `/public`. */
  photo: string;
  category: StyleCategory;
}

/** Um serviço prestado por um barbeiro. */
export interface Service {
  id: string;
  /** Liga este serviço ao tipo escolhido no primeiro passo do fluxo. */
  type: ServiceType;
  name: string;
  /** Duração em minutos. Define quantos intervalos da grelha o serviço ocupa. */
  durationMinutes: number;
  /** Preço em Kwanzas. Vem sempre de `src/config/business.ts`. */
  price: number;
  description?: string;
}

/** Intervalo de trabalho contínuo num dia. */
export interface TimeRange {
  /** `HH:mm` — início, inclusive. */
  start: string;
  /** `HH:mm` — fim, exclusive. */
  end: string;
}

/**
 * Horário semanal do barbeiro.
 *
 * Cada dia tem zero ou mais intervalos. Um dia sem intervalos é um dia de folga.
 * Dois intervalos no mesmo dia representam, por exemplo, uma pausa de almoço.
 */
export type WeeklySchedule = Record<WeekDay, TimeRange[]>;

/**
 * Uma barbearia parceira.
 *
 * Existe porque há dois clientes diferentes com duas perguntas diferentes. Quem
 * quer o barbeiro em casa pergunta "quem me vai cortar?"; quem vai ao salão
 * pergunta "qual é a casa mais perto de mim?". A primeira pergunta responde-se
 * com um `Barber`, a segunda com uma `Barbershop` — e sem esta entidade a
 * segunda não tinha resposta, porque a zona vivia espalhada pelos barbeiros.
 *
 * A casa é a dona do horário de porta aberta; o barbeiro nunca atende fora
 * dele, mesmo que o seu horário pessoal diga outra coisa.
 */
export interface Barbershop {
  id: string;
  /** Usado na URL. */
  slug: string;
  name: string;
  /** Morada legível, para quem vai lá ter. */
  address: string;
  /** Zona de Luanda. É por aqui que o cliente filtra. */
  area: string;
  /** Caminho a partir de `/public`. */
  photo: string;
  /** Uma linha sobre a casa. */
  description: string;
  /** Formatos que esta casa aceita. Reúne o que os seus barbeiros fazem. */
  locationTypes: LocationType[];
  /** Horário de porta aberta. Limita o horário de cada barbeiro da casa. */
  schedule: WeeklySchedule;
  /** Barbeiros que trabalham aqui, por `Barber.id`. */
  barberIds: string[];
}

/** Um barbeiro parceiro. */
export interface Barber {
  id: string;
  /** Usado na URL: `/barbeiros/[slug]`. */
  slug: string;
  name: string;
  /** Caminho a partir de `/public`. */
  photo: string;
  bio: string;
  specialties: string[];
  /** Zona de Luanda onde o barbeiro atende. */
  area: string;
  /**
   * Barbearia onde trabalha, por `Barbershop.id`.
   *
   * Opcional porque nem todo o barbeiro tem casa: há quem só faça domicílio.
   * Esse não aparece na jornada do salão, mas continua a aparecer na outra.
   */
  barbershopId?: string;
  /** Formatos de atendimento que este barbeiro aceita. */
  locationTypes: LocationType[];
  schedule: WeeklySchedule;
  services: Service[];
  /** Média das avaliações, de 1 a 5. `null` enquanto não houver avaliações. */
  rating: number | null;
  reviewCount: number;
  /** Anos de experiência, mostrados no perfil. */
  yearsOfExperience: number;
}

/** Umo agendamento. */
export interface Booking {
  id: string;
  barberId: string;
  /** Guardado para que o histórico sobreviva a mudanças no catálogo. */
  barberName: string;
  serviceId: string;
  serviceName: string;
  /** Barbearia onde foi marcado, quando veio pela jornada do salão. */
  barbershopId?: string;
  /** Guardado para o histórico sobreviver a mudanças no catálogo. */
  barbershopName?: string;
  /** Estilo de corte escolhido. */
  styleName?: string;
  /** Estilo de barba, quando o serviço a inclui. */
  beardStyleName?: string;
  /** Preço cobrado, já com a taxa de deslocação se aplicável. */
  price: number;
  durationMinutes: number;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm`, hora de início. */
  time: string;
  locationType: LocationType;
  /** Morada do cliente. Obrigatória quando `locationType` é `domicilio`. */
  address?: string;
  clientName: string;
  /** Telemóvel em formato internacional `+244XXXXXXXXX`. Identifica o cliente. */
  clientPhone: string;
  notes?: string;
  status: BookingStatus;
  /** ISO 8601 completo, com hora. */
  createdAt: string;
}

/** Avaliação de um agendamento concluído. */
export interface Review {
  id: string;
  bookingId: string;
  barberId: string;
  /** De 1 a 5. */
  rating: number;
  comment?: string;
  /**
   * Foto do corte, como data URL.
   *
   * Na fase Django isto passa a ser o URL de um ficheiro no servidor
   * (`ImageField` + armazenamento de media), e não a imagem embebida.
   */
  photo?: string;
  clientName: string;
  createdAt: string;
}

/** Dados necessários para criar um agendamento. */
export type BookingInput = Omit<Booking, 'id' | 'status' | 'createdAt'>;

/** Filtros aceites por `barbershopsService.getBarbershops()`. */
export interface BarbershopFilters {
  area?: string;
  locationType?: LocationType;
}

/** Filtros aceites por `barbersService.getBarbers()`. */
export interface BarberFilters {
  locationType?: LocationType;
  specialty?: string;
  area?: string;
}

/* -------------------------------------------------------------------------- */
/* Formato das respostas — imita o Django REST Framework                       */
/* -------------------------------------------------------------------------- */

/** Resposta paginada do DRF (`PageNumberPagination`). */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Erro de validação do DRF: um array de mensagens por campo. */
export interface ApiError {
  detail?: string;
  [field: string]: string[] | string | undefined;
}

/** Um intervalo de horário na grelha de agendamento. */
export interface TimeSlot {
  /** `HH:mm`. */
  time: string;
  available: boolean;
  /** Porque é que o intervalo não está disponível. Só para a interface. */
  reason?: 'ocupado' | 'passado' | 'fora-de-horario';
}

/**
 * Um intervalo na grelha de uma barbearia inteira.
 *
 * Traz consigo quem está livre a essa hora, para que a atribuição do barbeiro
 * não obrigue a recalcular a disponibilidade toda outra vez.
 */
export interface ShopTimeSlot extends TimeSlot {
  /** `Barber.id` de quem tem esta hora livre. Vazio quando não há ninguém. */
  barberIds: string[];
}
