import Image from 'next/image';
import Link from 'next/link';
import type { Barber } from '@/types';
import { getStartingPrice } from '@/services/barbersService';
import { formatKz } from '@/lib/format';
import { PRICING } from '@/config/business';
import { Rating } from '@/components/ui/Rating';
import { MapPin } from '@/components/ui/Icons';

/**
 * Card de um barbeiro, como em `Meet Talatona's Best Barbers.png`:
 * fotografia, nome, estrelas, a frase de um cliente, a zona e o preço.
 *
 * Server Component. O card inteiro é uma ligação: o `after:absolute` estica a
 * área clicável do link ao card todo sem aninhar elementos interactivos.
 *
 * O preço é o "desde" do barbeiro. Para quem faz domicílio já leva a taxa de
 * deslocação somada e di-lo — é o que a referência mostra, e é o preço que o
 * cliente vai mesmo ver no total.
 */
export function BarberCard({ barber, priority = false }: { barber: Barber; priority?: boolean }) {
  const doesHome = barber.locationTypes.includes('domicilio');
  const price = getStartingPrice(barber) + (doesHome ? PRICING.homeServiceFee : 0);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[10/7] overflow-hidden bg-surface-2">
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

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg leading-tight">
          <Link
            href={`/barbeiros/${barber.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {barber.name}
          </Link>
        </h3>

        {barber.rating !== null && (
          <div className="mt-1.5">
            <Rating value={barber.rating} count={barber.reviewCount} size="md" />
          </div>
        )}

        {barber.featuredQuote && (
          <blockquote className="mt-3 text-sm text-text-muted">
            “{barber.featuredQuote}”
          </blockquote>
        )}

        {/* Empurra a zona e o preço para o fundo, alinhados entre cards. */}
        <div className="min-h-4 flex-1" aria-hidden="true" />

        <p className="flex items-center gap-1.5 border-t border-border pt-4 text-sm text-text-muted">
          <MapPin className="size-4 shrink-0" />
          {barber.area}
        </p>

        <p className="mt-3">
          <span className="tabular block text-xl font-extrabold text-accent">
            {formatKz(price)}
          </span>
          <span className="block text-sm text-text-muted">
            {doesHome ? '(inclui deslocação)' : '(no salão)'}
          </span>
        </p>
      </div>
    </article>
  );
}
