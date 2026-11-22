'use client';

import type { ReactNode } from 'react';

/**
 * Card seleccionável do fluxo — serviço, estilo, barbeiro, localização.
 *
 * O estado de selecção não é dado só pela borda dourada: leva também um visto
 * preenchido no canto e `aria-pressed`, para que a escolha se perceba sem
 * distinguir cores e para que um leitor de ecrã a anuncie.
 *
 * As cores vêm dos tokens `selected`/`selected-border`, por isso o mesmo card
 * funciona na superfície clara do fluxo e na escura, sem condicionais.
 */
export function SelectableCard({
  selected,
  onSelect,
  children,
  className = '',
  label,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  /** Nome do que está a ser escolhido, para o leitor de ecrã. */
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      className={`relative w-full rounded-xl border-2 p-4 text-left transition-colors ${
        selected
          ? 'border-selected-border bg-selected'
          : 'border-border bg-surface hover:border-gold/60'
      } ${className}`}
    >
      {children}
      <SelectionMark selected={selected} />
    </button>
  );
}

/**
 * O círculo do canto: dourado cheio com visto quando escolhido, anel quando não.
 * `onPhoto` dá ao anel vazio um fundo, para se ver por cima de uma fotografia.
 */
export function SelectionMark({
  selected,
  className = 'absolute right-3 top-3',
  onPhoto = false,
}: {
  selected: boolean;
  className?: string;
  onPhoto?: boolean;
}) {
  return (
    <span className={className} aria-hidden="true">
      {selected ? (
        <span className="flex size-6 items-center justify-center rounded-full bg-gold text-ink">
          <svg viewBox="0 0 16 16" className="size-3.5">
            <path d="m4 8.5 2.5 2.5L12 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : (
        <span
          className={`block size-6 rounded-full border-2 ${
            onPhoto ? 'border-white bg-black/15' : 'border-gold/70'
          }`}
        />
      )}
    </span>
  );
}
