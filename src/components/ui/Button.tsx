import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // O dourado é a cor da acção. Só os botões primários o usam.
  primary:
    'bg-primary text-primary-ink hover:bg-primary/90 active:bg-primary-dim shadow-gold',
  secondary:
    'bg-surface-2 text-text border border-border hover:border-primary-dim hover:text-primary',
  ghost: 'text-text-muted hover:text-text hover:bg-surface-2',
  danger: 'bg-cancelled-tint text-cancelled border border-cancelled/40 hover:bg-cancelled/20',
};

const SIZES: Record<Size, string> = {
  // `min-h` garante o alvo de toque de 44px recomendado no telemóvel.
  sm: 'min-h-[38px] px-3 text-sm gap-1.5',
  md: 'min-h-[44px] px-5 text-base gap-2',
  lg: 'min-h-[52px] px-7 text-lg gap-2.5',
};

const BASE =
  'inline-flex items-center justify-center rounded-md font-semibold ' +
  'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'disabled:pointer-events-none select-none';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  Omit<ComponentProps<'button'>, 'className' | 'children'>;

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<ComponentProps<typeof Link>, 'className' | 'children'>;

/** O mesmo aspecto do `Button`, mas é uma ligação de verdade — navega e é indexável. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
