/**
 * Ícones de linha, no estilo do template: traço fino, cantos arredondados,
 * desenhados numa grelha de 24.
 *
 * São decorativos — quem os usa põe o texto ao lado. Por isso levam sempre
 * `aria-hidden` e nunca um `title`.
 */

type IconProps = { className?: string };

const base = (className = 'size-6') =>
  ({
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  });

/** Tesoura — a marca, e o serviço de corte. */
export function Scissors({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8.1 7.6 20 18M20 6 8.1 16.4" />
    </svg>
  );
}

/** Coroa — plano de assinatura. */
export function Crown({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 8l3.5 2.8L12 5l5.5 5.8L21 8l-1.6 10H4.6L3 8Z" />
      <path d="M4.6 18h14.8" />
    </svg>
  );
}

/** Barbeiro verificado. */
export function BarberCheck({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="10" cy="8" r="3.4" />
      <path d="M3.5 20c0-3.3 2.9-5.6 6.5-5.6 1 0 2 .2 2.8.5" />
      <path d="m15.5 18 1.8 1.8 3.4-3.6" />
    </svg>
  );
}

/** Agendamento rápido. */
export function CalendarClock({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M20 11V6.5a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 4 6.5v12A1.5 1.5 0 0 0 5.5 20H12" />
      <path d="M8 3v4M16 3v4M4 9.5h16" />
      <circle cx="17.5" cy="17.5" r="4" />
      <path d="M17.5 15.8v1.9l1.3.8" />
    </svg>
  );
}

/** Serviço ao domicílio. */
export function HomePin({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9.8V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.8" />
      <circle cx="12" cy="13.5" r="1.8" />
      <path d="M12 15.3V17" />
    </svg>
  );
}

/** Pagamento seguro. */
export function ShieldCard({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3.5 5 6v6c0 4.2 2.9 7.4 7 8.5 4.1-1.1 7-4.3 7-8.5V6l-7-2.5Z" />
      <path d="M8.8 11.5h6.4M8.8 14.2h3.4" />
    </svg>
  );
}

/** Estilo / espelho. */
export function Sparkle({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5 10.1 12.8 4.5 10.9 10.1 9 12 3.5Z" />
      <path d="M18.5 16.5 19.3 19l2.2.8-2.2.8-.8 2.2" />
    </svg>
  );
}

/** Pontualidade. */
export function Clock({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.4 2" />
    </svg>
  );
}

/** Profissionalismo. */
export function Badge({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="9.5" r="5" />
      <path d="m8.5 13.8-1 6.2 4.5-2.4 4.5 2.4-1-6.2" />
    </svg>
  );
}

/** Satisfação. */
export function Star({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m12 4 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 4Z" />
    </svg>
  );
}

/** Localização. */
export function MapPin({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M19 10.3c0 5.1-7 11-7 11s-7-5.9-7-11a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </svg>
  );
}

/** Visto, para listas de benefícios. */
export function Check({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

/** Navalha / estilo de barba. */
export function Razor({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 4.5h9.5a2 2 0 0 1 2 2v2.8H6a2 2 0 0 1-2-2V4.5Z" />
      <path d="M10.5 9.3v4.2a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4V9.3" />
    </svg>
  );
}
