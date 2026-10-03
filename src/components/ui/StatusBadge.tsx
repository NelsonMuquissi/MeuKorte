import type { BookingStatus } from '@/types';

/**
 * Badge do estado de uma marcação.
 *
 * Cada estado tem cor própria, mas a cor NUNCA é o único sinal: o badge leva
 * sempre um ícone com forma distinta e o nome do estado por extenso. Quem não
 * distingue as cores, ou está ao sol com o telemóvel, continua a perceber.
 *
 * O dourado da marca não aparece aqui — dourado é acção, nunca estado.
 */

const STATUS: Record<
  BookingStatus,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  pendente: {
    label: 'Pendente',
    classes: 'bg-pending-tint text-pending border-pending/40',
    // Relógio — está à espera.
    icon: (
      <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  confirmada: {
    label: 'Confirmada',
    classes: 'bg-confirmed-tint text-confirmed border-confirmed/40',
    // Visto dentro de um círculo.
    icon: (
      <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m5 8 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  concluida: {
    label: 'Concluída',
    classes: 'bg-done-tint text-done border-done/40',
    // Duplo visto — já aconteceu.
    icon: (
      <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden="true">
        <path d="m1.5 8.5 2.5 2.5 5-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m7 11 5.5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  cancelada: {
    label: 'Cancelada',
    classes: 'bg-cancelled-tint text-cancelled border-cancelled/40',
    // Cruz dentro de um círculo.
    icon: (
      <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m5.5 5.5 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, classes, icon } = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {icon}
      {label}
    </span>
  );
}

/** O nome do estado por extenso, para usar fora do badge. */
export function statusLabel(status: BookingStatus): string {
  return STATUS[status].label;
}
