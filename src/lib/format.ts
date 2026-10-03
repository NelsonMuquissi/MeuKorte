/**
 * Formatadores de apresentação.
 *
 * Tudo o que aparece ao utilizador em Kwanzas, telemóvel ou data passa por aqui,
 * para que o formato seja o mesmo em toda a aplicação.
 *
 * Nota sobre hidratação: estas funções são deterministas e não dependem do fuso
 * horário do navegador nem da hora actual, por isso podem ser usadas em Server
 * Components sem risco de divergência entre servidor e cliente. As funções que
 * dependem do "agora" estão em `src/lib/date.ts` e são marcadas como tal.
 */

/**
 * Formata um valor em Kwanzas: `5000` → `"5 000 Kz"`.
 *
 * Usa espaço fino inquebrável como separador de milhares, que é a convenção em
 * Angola, e impede que o valor parta a linha antes do "Kz".
 */
export function formatKz(value: number): string {
  const rounded = Math.round(value);
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${grouped} Kz`;
}

/**
 * Formata um telemóvel angolano para leitura: `+244923456789` → `"+244 923 456 789"`.
 * Se o número não tiver o formato esperado, devolve-o tal como veio.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('244') ? digits.slice(3) : digits;
  if (national.length !== 9) return phone;
  return `+244 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

/**
 * Normaliza um telemóvel para a forma canónica `+244XXXXXXXXX`.
 *
 * É esta forma que identifica o cliente no armazenamento, para que
 * `923 456 789`, `+244923456789` e `00244923456789` sejam a mesma pessoa.
 * Devolve `null` se não for um telemóvel angolano válido.
 */
export function normalizePhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00244')) digits = digits.slice(5);
  else if (digits.startsWith('244')) digits = digits.slice(3);
  // Os telemóveis em Angola têm 9 algarismos e começam por 9.
  if (!/^9\d{8}$/.test(digits)) return null;
  return `+244${digits}`;
}

/** Diz se um telemóvel é válido, sem o normalizar. */
export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone) !== null;
}

const WEEKDAYS = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
] as const;

const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

export { WEEKDAYS, WEEKDAYS_SHORT, MONTHS, MONTHS_SHORT };

/**
 * Converte `"YYYY-MM-DD"` num `Date` à meia-noite local.
 *
 * Não usar `new Date("YYYY-MM-DD")`: essa forma é lida como UTC e, em fusos a
 * oeste, devolve o dia anterior. Angola está em UTC+1, mas a conversão explícita
 * evita o problema em qualquer fuso, incluindo o do servidor de build.
 */
export function parseDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Converte um `Date` em `"YYYY-MM-DD"`, segundo a hora local. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `"2026-10-15"` → `"15 de Outubro"`. */
export function formatDate(isoDate: string): string {
  const d = parseDate(isoDate);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** `"2026-10-15"` → `"quarta-feira, 15 de Outubro de 2026"`. */
export function formatDateLong(isoDate: string): string {
  const d = parseDate(isoDate);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

/** `"2026-10-15"` → `"qua, 15 Out"`. Para cards e listas estreitas. */
export function formatDateShort(isoDate: string): string {
  const d = parseDate(isoDate);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** `45` → `"45 min"`; `90` → `"1h30"`; `60` → `"1h"`. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** Converte `"HH:mm"` em minutos desde a meia-noite. `"09:30"` → `570`. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Converte minutos desde a meia-noite em `"HH:mm"`. `570` → `"09:30"`. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Texto legível de um formato de atendimento. */
export function formatLocationType(type: 'salao' | 'domicilio'): string {
  return type === 'salao' ? 'No salão' : 'Ao domicílio';
}
