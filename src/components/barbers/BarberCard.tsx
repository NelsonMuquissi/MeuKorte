import Image from 'next/image';
import Link from 'next/link';
import type { Barber } from '@/types';
import { getStartingPrice } from '@/services/barbersService';
import { formatKz } from '@/lib/format';
import { Rating } from '@/components/ui/Rating';

/**
 * Card de um barbeiro. Server Component.
 *
 * O card inteiro é uma ligação. O `after:absolute` estica a área clicável do
 * link ao card todo sem aninhar elementos interactivos, que seria inválido.
 */
export function BarberCard({ barber, priority = false }: { barber: Barber; priority?: boolean }) {
  const startingPrice = getStartingPrice(barber);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-primary-dim">
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        <Image
          src={barber.photo}
          alt={`Fotografia de ${barber.name}`}
          fill
          // Uma coluna no telemóvel, duas em tablet, quatro no computador.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl leading-tight">
            <Link
              href={`/barbeiros/${barber.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {barber.name}
            </Link>
          </h3>
        </div>

        {barber.rating !== null && (
          <div className="mt-1.5">
            <Rating value={barber.rating} count={barber.reviewCount} />
          </div>
        )}

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {barber.specialties.map((specialty) => (
            <li
              key={specialty}
              className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-text-muted"
            >
              {specialty}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-sm text-text-muted">
          {barber.area} ·{' '}
          {barber.locationTypes.includes('domicilio')
            ? barber.locationTypes.includes('salao')
              ? 'Salão e domicílio'
              : 'Só ao domicílio'
            : 'Só no salão'}
        </p>

        <p className="mt-auto pt-4 text-sm text-text-muted">
          a partir de{' '}
          <span className="tabular text-base font-semibold text-primary">
            {formatKz(startingPrice)}
          </span>
        </p>
      </div>
    </article>
  );
}
