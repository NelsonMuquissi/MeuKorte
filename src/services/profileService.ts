/**
 * Perfil local do cliente.
 *
 * Guarda o que é do cliente e não de um agendamento em concreto: o telemóvel
 * com que ele se identifica e as moradas que já usou. Serve para o fluxo não
 * voltar a pedir aquilo que já foi escrito uma vez.
 *
 * Existe por duas razões:
 *  1. o `localStorage` só pode ser tocado dentro de `src/services/` — antes
 *     disto o telemóvel era gravado directamente a partir dos componentes;
 *  2. na fase Django isto passa a `GET/PATCH /api/me/` e a
 *     `/api/me/addresses/`, com as mesmas assinaturas, e mais nada muda.
 *
 * Nada aqui é segredo: são dados do próprio dispositivo, que o cliente escreveu.
 * Mesmo assim o telemóvel é sempre normalizado antes de ser gravado, para que
 * "923 456 789" e "+244923456789" encontrem os mesmos agendamentos.
 */

import { read, write, remove, KEYS } from './storage';
import { normalizePhone } from '@/lib/format';

/** Uma morada que o cliente guardou, para reutilizar no passo de localização. */
export interface SavedAddress {
  /** `casa`, `trabalho` ou um identificador gerado para moradas avulsas. */
  id: string;
  /** Como aparece no atalho: "Casa", "Trabalho". */
  label: string;
  address: string;
}

/**
 * Os dois atalhos que o template mostra no passo de localização.
 *
 * Aparecem sempre, mesmo vazios: um atalho vazio convida a preencher, e é mais
 * claro do que não mostrar nada e esperar que o cliente descubra que podia ter
 * guardado a morada.
 */
export const ADDRESS_SLOTS = [
  { id: 'casa', label: 'Casa' },
  { id: 'trabalho', label: 'Trabalho' },
] as const;

/* -------------------------------------------------------------------------- */
/* Telemóvel                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * O último telemóvel usado, já normalizado, ou `null`.
 *
 * É o que identifica o cliente enquanto não há contas no Django.
 */
export function getLastPhone(): string | null {
  const stored = read<string | null>(KEYS.lastPhone, null);
  return stored ? normalizePhone(stored) : null;
}

/** Guarda o telemóvel. Ignora um número inválido em vez de gravar lixo. */
export function setLastPhone(phone: string): void {
  const normalized = normalizePhone(phone);
  if (normalized) write(KEYS.lastPhone, normalized);
}

/* -------------------------------------------------------------------------- */
/* Nome                                                                        */
/* -------------------------------------------------------------------------- */

/** O nome com que o cliente agendou da última vez, ou `null`. */
export function getLastName(): string | null {
  const stored = read<string | null>(KEYS.lastName, null);
  return stored?.trim() || null;
}

/** Guarda o nome. Um nome de uma letra é engano, e não se grava. */
export function setLastName(name: string): void {
  const trimmed = name.trim();
  if (trimmed.length >= 2) write(KEYS.lastName, trimmed);
}

/**
 * Esquece quem é o cliente neste dispositivo — o "Sair" da área do cliente.
 *
 * Apaga a identificação, NÃO os agendamentos: quem sai e volta a entrar com o
 * mesmo número tem de voltar a encontrar o que marcou. Apagar o histórico aqui
 * seria uma perda silenciosa de dados que o cliente não pediu.
 */
export function signOut(): void {
  remove(KEYS.lastPhone);
  remove(KEYS.lastName);
}

/* -------------------------------------------------------------------------- */
/* Moradas                                                                     */
/* -------------------------------------------------------------------------- */

/** As moradas guardadas neste dispositivo. */
export function getSavedAddresses(): SavedAddress[] {
  return read<SavedAddress[]>(KEYS.addresses, []);
}

/** A morada guardada num dos atalhos, ou `null` se esse atalho está vazio. */
export function getSavedAddress(id: string): SavedAddress | null {
  return getSavedAddresses().find((a) => a.id === id) ?? null;
}

/**
 * Guarda uma morada num atalho, substituindo a que lá estivesse.
 *
 * Uma morada em branco apaga o atalho: é como o cliente desfaz, sem precisar de
 * um botão de apagar só para isso.
 */
export function saveAddress(id: string, label: string, address: string): SavedAddress[] {
  const others = getSavedAddresses().filter((a) => a.id !== id);
  const trimmed = address.trim();
  const next = trimmed ? [...others, { id, label, address: trimmed }] : others;
  write(KEYS.addresses, next);
  return next;
}
