import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Botões.
 *
 * As variantes seguem o template:
 *   - `action`    o primário do fluxo. Dourado na superfície escura, PRETO na
 *                 clara — é o "Continuar →". Vem dos tokens, não de condicionais.
 *   - `gold`      dourado sempre, independentemente da superfície. Para os CTA
 *                 de destaque sobre fundo escuro (hero, confirmação).
 *   - `outline`   contorno, para a acção secundária sobre fundo escuro.
 *   - `secondary` card/superfície, para acções de menor peso.
 *   - `ghost`     sem fundo.
 *   - `danger`    cancelar.
 */

type Variant = 'action' | 'gold' | 'outline' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  action: 'bg-action text-action-ink hover:opacity-90',
  gold: 'bg-gold text-ink hover:brightness-105',
  outline: 'border border-current/30 text-text hover:border-current/60',
  secondary: 'bg-surface-2 text-text border border-border hover:border-primary-dim',
  ghost: 'text-text-muted hover:text-text hover:bg-surface-2',
  danger:
    'text-cancelled border border-cancelled/40 hover:bg-cancelled/10',
};

const SIZES: Record<Size, string> = {
  // `min-h` garante o alvo de toque de 44px no telemóvel.
  sm: 'min-h-[38px] px-3.5 text-sm gap-1.5',
  md: 'min-h-[46px] px-5 text-base gap-2',
  lg: 'min-h-[54px] px-7 text-base gap-2.5',
};

const BASE =
  'inline-flex items-center justify-center rounded-md font-bold ' +
  'transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ' +
  'disabled:pointer-events-none select-none';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & Omit<ComponentProps<'button'>, 'className' | 'children'>;

export function Button({
  variant = 'action',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps & Omit<ComponentProps<typeof Link>, 'className' | 'children'>;

/** O mesmo aspecto, mas é uma ligação de verdade — navega e é indexável. */
export function ButtonLink({
  variant = 'action',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}

/** Seta usada nos botões de avanço do fluxo ("Continuar →"). */
export function ArrowRight() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 10h11m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
