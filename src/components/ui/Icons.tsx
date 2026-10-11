/**
 * Ícones de linha, no estilo do template: traço fino, cantos arredondados,
 * desenhados numa grelha de 24.
 *
 * São decorativos — quem os usa põe o texto ao lado. Por isso levam sempre
 * `aria-hidden` e nunca um `title`.
 */

type IconProps = { className?: string; style?: React.CSSProperties };

const base = (className = 'size-6', style?: React.CSSProperties) =>
  ({
    style,
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
export function Scissors({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8.1 7.6 20 18M20 6 8.1 16.4" />
    </svg>
  );
}

/** Coroa — plano de assinatura. */
export function Crown({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M3 8l3.5 2.8L12 5l5.5 5.8L21 8l-1.6 10H4.6L3 8Z" />
      <path d="M4.6 18h14.8" />
    </svg>
  );
}

/** Barbeiro verificado. */
export function BarberCheck({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="10" cy="8" r="3.4" />
      <path d="M3.5 20c0-3.3 2.9-5.6 6.5-5.6 1 0 2 .2 2.8.5" />
      <path d="m15.5 18 1.8 1.8 3.4-3.6" />
    </svg>
  );
}

/** Agendamento rápido. */
export function CalendarClock({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M20 11V6.5a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 4 6.5v12A1.5 1.5 0 0 0 5.5 20H12" />
      <path d="M8 3v4M16 3v4M4 9.5h16" />
      <circle cx="17.5" cy="17.5" r="4" />
      <path d="M17.5 15.8v1.9l1.3.8" />
    </svg>
  );
}

/** Serviço ao domicílio. */
export function HomePin({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9.8V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.8" />
      <circle cx="12" cy="13.5" r="1.8" />
      <path d="M12 15.3V17" />
    </svg>
  );
}

/** Pagamento seguro. */
export function ShieldCard({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M12 3.5 5 6v6c0 4.2 2.9 7.4 7 8.5 4.1-1.1 7-4.3 7-8.5V6l-7-2.5Z" />
      <path d="M8.8 11.5h6.4M8.8 14.2h3.4" />
    </svg>
  );
}

/** Estilo / espelho. */
export function Sparkle({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5 10.1 12.8 4.5 10.9 10.1 9 12 3.5Z" />
      <path d="M18.5 16.5 19.3 19l2.2.8-2.2.8-.8 2.2" />
    </svg>
  );
}

/** Pontualidade. */
export function Clock({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.4 2" />
    </svg>
  );
}

/** Profissionalismo. */
export function Badge({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="12" cy="9.5" r="5" />
      <path d="m8.5 13.8-1 6.2 4.5-2.4 4.5 2.4-1-6.2" />
    </svg>
  );
}

/** Satisfação. */
export function Star({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="m12 4 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 4Z" />
    </svg>
  );
}

/** Localização. */
export function MapPin({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M19 10.3c0 5.1-7 11-7 11s-7-5.9-7-11a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </svg>
  );
}

/** Visto, para listas de benefícios. */
export function Check({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

/** Navalha / estilo de barba. */
export function Razor({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M4 4.5h9.5a2 2 0 0 1 2 2v2.8H6a2 2 0 0 1-2-2V4.5Z" />
      <path d="M10.5 9.3v4.2a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4V9.3" />
    </svg>
  );
}

/**
 * Cabeça com corte — card "Corte de cabelo" do primeiro passo do fluxo.
 *
 * O template usa uma ilustração de perfil em vez de um pictograma, para que os
 * dois serviços se distingam de relance, pelo desenho e não pela leitura.
 */
export function HeadCut({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M6.2 11.5a5.8 5.8 0 0 1 11.6 0v1.2h.9a1.3 1.3 0 0 1 0 2.6h-.9v1.5a2.5 2.5 0 0 1-2.5 2.5h-1.1V21" />
      <path d="M6.2 12.7v3.5a2.5 2.5 0 0 0 2.5 2.5" />
      {/* O cabelo: a linha que muda entre os dois cards. */}
      <path d="M6.4 10.3c1.4-2.4 3.5-3.6 5.6-3.6s4.2 1.2 5.6 3.6" />
      <path d="M9 8.1V5.8M12 7.2V4.8M15 8.1V5.8" />
    </svg>
  );
}

/**
 * Cabeça com barba — card "Corte + Barba".
 *
 * A mesma cabeça do `HeadCut`, para que a diferença entre os dois cards seja
 * só a barba. Desenhos diferentes fariam parecer serviços sem relação.
 */
export function HeadBeard({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M6.2 11.5a5.8 5.8 0 0 1 11.6 0v1.2h.9a1.3 1.3 0 0 1 0 2.6h-.9v1.5a2.5 2.5 0 0 1-2.5 2.5h-1.1V21" />
      <path d="M6.4 10.3c1.4-2.4 3.5-3.6 5.6-3.6s4.2 1.2 5.6 3.6" />
      {/* A barba: contorno do queixo, cheio por baixo. */}
      <path d="M7.4 13.2v2.6a4.6 4.6 0 0 0 4.6 4.6 4.6 4.6 0 0 0 4.6-4.6v-2.6" />
      <path d="M9.6 16.6c1.5.9 3.3.9 4.8 0" />
    </svg>
  );
}

/** Casa — "Início" da barra lateral da área do cliente. */
export function Home({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.8V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

/** Pessoa — "Os meus dados". */
export function User({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}

/** Balão de conversa — "Suporte". */
export function Support({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M20 12.5c0 3.9-3.6 7-8 7a9 9 0 0 1-2.6-.38L4.5 20.5l1.2-3.2A6.6 6.6 0 0 1 4 12.5c0-3.9 3.6-7 8-7s8 3.1 8 7Z" />
      <path d="M10 10.4a2.1 2.1 0 1 1 2.9 2c-.5.25-.9.7-.9 1.3v.3" />
      <path d="M12 16.1h.01" />
    </svg>
  );
}

/** Porta com seta — "Sair". Não apaga nada, só esquece quem está a usar. */
export function SignOut({ className, style }: IconProps) {
  return (
    <svg {...base(className, style)}>
      <path d="M14 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 15.5 5.5 12 10 8.5" />
      <path d="M5.5 12H14" />
    </svg>
  );
}
