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

/** Ciclo de vida de uma marcação, tal como no fluxo do plano do MVP. */
export type BookingStatus = 'pendente' | 'confirmada' | 'concluida' | 'cancelada';

/** Dia da semana. 0 = domingo, 6 = sábado (igual ao `Date.getDay()`). */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Um serviço prestado por um barbeiro. */
export interface Service {
  id: string;
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

/** Uma marcação. */
export interface Booking {
  id: string;
  barberId: string;
  /** Guardado para que o histórico sobreviva a mudanças no catálogo. */
  barberName: string;
  serviceId: string;
  serviceName: string;
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

/** Avaliação de uma marcação concluída. */
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

/** Dados necessários para criar uma marcação. */
export type BookingInput = Omit<Booking, 'id' | 'status' | 'createdAt'>;

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

/** Um intervalo de horário na grelha de marcação. */
export interface TimeSlot {
  /** `HH:mm`. */
  time: string;
  available: boolean;
  /** Porque é que o intervalo não está disponível. Só para a interface. */
  reason?: 'ocupado' | 'passado' | 'fora-de-horario';
}
