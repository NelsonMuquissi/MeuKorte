/**
 * Camada de armazenamento.
 *
 * É o ÚNICO sítio da aplicação que conhece o `localStorage`. Os serviços falam com
 * este módulo; os componentes nunca falam com nenhum dos dois directamente.
 *
 * Na fase Django, este ficheiro é substituído por chamadas `fetch` à API e mais
 * nada precisa de mudar.
 *
 * Tem de aguentar três situações em que o `localStorage` não existe ou falha:
 *  1. render no servidor — não há `window`;
 *  2. navegação privada no Safari, ou cookies bloqueados — o acesso lança excepção;
 *  3. quota esgotada ao gravar — `QuotaExceededError`.
 *
 * Em qualquer um dos casos a aplicação continua a funcionar, apenas sem persistir.
 */

const PREFIX = 'meukorte:';

/**
 * Verifica se o `localStorage` está mesmo utilizável.
 *
 * Não basta testar `typeof window`: em navegação privada o objecto existe mas
 * lança ao gravar. A única forma fiável é tentar escrever.
 */
function isAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const probe = `${PREFIX}__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Memória de recurso, usada quando o `localStorage` não está disponível.
 * Mantém a sessão a funcionar; os dados perdem-se ao fechar o separador.
 */
const fallback = new Map<string, string>();

/** Lê e desserializa um valor. Devolve `defaultValue` se não existir ou estiver corrompido. */
export function read<T>(key: string, defaultValue: T): T {
  const fullKey = PREFIX + key;
  try {
    const raw = isAvailable()
      ? window.localStorage.getItem(fullKey)
      : fallback.get(fullKey) ?? null;
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    // JSON inválido — alguém mexeu no armazenamento, ou mudou o formato dos dados.
    // Devolver o valor por omissão é melhor do que rebentar a página.
    return defaultValue;
  }
}

/** Serializa e grava um valor. Devolve `false` se não conseguiu persistir. */
export function write<T>(key: string, value: T): boolean {
  const fullKey = PREFIX + key;
  const raw = JSON.stringify(value);
  if (!isAvailable()) {
    fallback.set(fullKey, raw);
    return false;
  }
  try {
    window.localStorage.setItem(fullKey, raw);
    return true;
  } catch {
    // Quota esgotada — normalmente por causa das fotos dos cortes em data URL.
    fallback.set(fullKey, raw);
    return false;
  }
}

/** Remove uma chave. */
export function remove(key: string): void {
  const fullKey = PREFIX + key;
  fallback.delete(fullKey);
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(fullKey);
  } catch {
    /* não há nada a fazer, e não vale a pena partir a página por isto */
  }
}

/** Chaves usadas pela aplicação, reunidas para não haver literais espalhados. */
export const KEYS = {
  bookings: 'bookings',
  reviews: 'reviews',
} as const;

/**
 * Gera um identificador único.
 *
 * Usa `crypto.randomUUID` quando existe. Na fase Django os identificadores passam
 * a vir do servidor e esta função deixa de ser necessária.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Avisa a aplicação de que os dados locais mudaram.
 *
 * O `localStorage` só dispara o evento `storage` noutros separadores, nunca no
 * que fez a alteração. Este evento próprio permite que o hook `useLocalBookings`
 * se actualize na mesma página.
 */
export const STORAGE_EVENT = 'meukorte:storage-changed';

export function notifyChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}
