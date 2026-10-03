import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Realça o card com a cor da marca. Usado no plano recomendado. */
  highlighted?: boolean;
}

export function Card({ children, className = '', highlighted = false }: CardProps) {
  return (
    <div
      className={`rounded-lg border bg-surface shadow-md ${
        highlighted ? 'border-primary/50 shadow-gold' : 'border-border'
      } ${className}`}
    >
      {children}
    </div>
  );
}
