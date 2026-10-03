'use client';

import { useEffect, useState } from 'react';
import type { Review } from '@/types';
import { getReviewsByBarber } from '@/services/reviewsService';
import { Rating } from '@/components/ui/Rating';
import { STORAGE_EVENT } from '@/services/storage';

/**
 * Avaliações de um barbeiro.
 *
 * Componente cliente separado porque as avaliações vivem no `localStorage` e,
 * por isso, não existem no servidor. Se isto fosse renderizado no servidor, o
 * HTML não teria avaliações nenhumas e o React acusaria divergência na hidratação.
 *
 * A leitura acontece sempre dentro do `useEffect`: o primeiro render é igual ao
 * do servidor (o estado de carregamento) e só depois é que os dados entram.
 */
export function BarberReviews({ barberId }: { barberId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { results } = await getReviewsByBarber(barberId);
      if (active) {
        setReviews(results);
        setLoading(false);
      }
    }

    void load();

    // Uma avaliação feita noutro separador aparece aqui sem recarregar.
    const onChange = () => void load();
    window.addEventListener(STORAGE_EVENT, onChange);
    window.addEventListener('storage', onChange);

    return () => {
      active = false;
      window.removeEventListener(STORAGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [barberId]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="A carregar avaliações">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-text-muted">
        Ainda não há avaliações feitas neste dispositivo. Depois do teu corte,
        podes avaliar em &quot;As minhas marcações&quot;.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-text">{review.clientName}</p>
            <Rating value={review.rating} />
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-text-muted">{review.comment}</p>
          )}
          {review.photo && (
            // Imagem local em base64: o next/image não a consegue optimizar,
            // por isso vai um <img> simples. Na fase Django passa a next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.photo}
              alt={`Corte feito por ${review.clientName}`}
              className="mt-3 h-40 w-full rounded-md object-cover sm:w-56"
              loading="lazy"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
