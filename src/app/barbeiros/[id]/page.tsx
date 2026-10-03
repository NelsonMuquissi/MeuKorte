import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { BarberReviews } from '@/components/barbers/BarberReviews';
import { getBarberById } from '@/services/barbersService';
import { barbers } from '@/data/barbers';
import { formatKz, formatDuration, WEEKDAYS } from '@/lib/format';
import { barberWhatsappLink } from '@/lib/whatsapp';
import type { WeekDay } from '@/types';

/**
 * Gera uma página estática por barbeiro no momento do build.
 *
 * Com quatro barbeiros são quatro páginas HTML prontas, servidas da CDN do
 * Vercel sem passar por nenhuma função. Na fase Django, esta função passa a
 * buscar a lista de slugs à API.
 */
export async function generateStaticParams() {
  return barbers.map((barber) => ({ id: barber.slug }));
}

/** Qualquer `id` fora dos gerados acima dá 404 em vez de ser renderizado. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const barber = await getBarberById(id);

  if (!barber) {
    return { title: 'Barbeiro não encontrado' };
  }

  const description =
    `${barber.name}, barbeiro em ${barber.area}, Luanda. ` +
    `${barber.specialties.join(', ')}. ` +
    `A partir de ${formatKz(Math.min(...barber.services.map((s) => s.price)))}.`;

  return {
    title: barber.name,
    description,
    alternates: { canonical: `/barbeiros/${barber.slug}` },
    openGraph: {
      type: 'profile',
      title: `${barber.name} · Meu Korte`,
      description,
      url: `/barbeiros/${barber.slug}`,
      // A foto do barbeiro é o que aparece quando o link é partilhado no
      // WhatsApp ou no Instagram.
      images: [{ url: barber.photo, width: 800, height: 800, alt: barber.name }],
    },
  };
}

export default async function BarberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const barber = await getBarberById(id);

  if (!barber) notFound();

  const workingDays = ([0, 1, 2, 3, 4, 5, 6] as WeekDay[]).map((day) => ({
    day,
    label: WEEKDAYS[day],
    ranges: barber.schedule[day] ?? [],
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {/* ---- Cabeçalho do perfil ---------------------------------------- */}
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg border border-border bg-surface-2 lg:mx-0 lg:max-w-none">
          <Image
            src={barber.photo}
            alt={`Fotografia de ${barber.name}`}
            fill
            sizes="(max-width: 1024px) 320px, 320px"
            className="object-cover"
            priority
          />
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl">{barber.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {barber.rating !== null && (
              <Rating value={barber.rating} count={barber.reviewCount} size="md" />
            )}
            <span className="text-sm text-text-muted">
              {barber.yearsOfExperience} anos de experiência
            </span>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {barber.specialties.map((specialty) => (
              <li
                key={specialty}
                className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-text-muted"
              >
                {specialty}
              </li>
            ))}
          </ul>

          <p className="mt-5 max-w-prose text-text-muted">{barber.bio}</p>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-text-muted">Zona</dt>
              <dd className="font-semibold text-text">{barber.area}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Atendimento</dt>
              <dd className="font-semibold text-text">
                {barber.locationTypes.includes('salao') &&
                barber.locationTypes.includes('domicilio')
                  ? 'No salão e ao domicílio'
                  : barber.locationTypes.includes('domicilio')
                    ? 'Só ao domicílio'
                    : 'Só no salão'}
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/marcar?barbeiro=${barber.id}`} size="lg">
              Marcar com este barbeiro
            </ButtonLink>
            <a
              href={barberWhatsappLink(barber.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center justify-center rounded-md border border-border bg-surface-2 px-7 text-lg font-semibold text-text transition-colors hover:border-primary-dim hover:text-primary"
            >
              Tirar uma dúvida
            </a>
          </div>
        </div>
      </div>

      {/* ---- Serviços e horário ----------------------------------------- */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="text-2xl sm:text-3xl">Serviços</h2>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {barber.services.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans text-base font-semibold normal-case tracking-normal text-text">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="mt-0.5 text-sm text-text-muted">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="tabular font-semibold text-primary">
                    {formatKz(service.price)}
                  </p>
                  <p className="tabular text-sm text-text-muted">
                    {formatDuration(service.durationMinutes)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl">Horário</h2>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface text-sm">
            {workingDays.map(({ day, label, ranges }) => (
              <li
                key={day}
                className="flex items-baseline justify-between gap-4 px-4 py-2.5"
              >
                <span className="capitalize text-text-muted">{label}</span>
                {ranges.length === 0 ? (
                  <span className="text-text-muted">Fechado</span>
                ) : (
                  <span className="tabular text-right text-text">
                    {ranges.map((r) => `${r.start}–${r.end}`).join(' · ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---- Avaliações -------------------------------------------------- */}
      <section className="mt-14">
        <h2 className="text-2xl sm:text-3xl">Avaliações</h2>
        <div className="mt-4">
          <BarberReviews barberId={barber.id} />
        </div>
      </section>
    </div>
  );
}
