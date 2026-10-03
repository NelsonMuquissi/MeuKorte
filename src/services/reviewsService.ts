/**
 * Serviço de avaliações.
 *
 * Equivalente futuro: `/api/reviews/`.
 */

import type { Review, PaginatedResponse } from '@/types';
import { read, write, KEYS, generateId, notifyChange } from './storage';
import { getBookingById } from './bookingsService';

function readReviews(): Review[] {
  return read<Review[]>(KEYS.reviews, []);
}

function writeReviews(reviews: Review[]): void {
  write(KEYS.reviews, reviews);
  notifyChange();
}

/**
 * Cria uma avaliação para uma marcação concluída.
 *
 * Só se avalia o que já aconteceu, e só uma vez por marcação — as duas regras
 * passam para o serializer do DRF na fase seguinte.
 *
 * @param photo Foto do corte, como data URL. Na fase Django isto passa a ser um
 *              upload para o servidor; ver `src/lib/image.ts`.
 *
 * Equivalente futuro: `POST /api/reviews/`
 */
export async function createReview(
  bookingId: string,
  rating: number,
  comment?: string,
  photo?: string,
): Promise<Review> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('A avaliação tem de ser de 1 a 5 estrelas.');
  }

  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error('Marcação não encontrada.');
  if (booking.status !== 'concluida') {
    throw new Error('Só podes avaliar marcações já concluídas.');
  }

  const reviews = readReviews();
  if (reviews.some((r) => r.bookingId === bookingId)) {
    throw new Error('Esta marcação já foi avaliada.');
  }

  const review: Review = {
    id: generateId(),
    bookingId,
    barberId: booking.barberId,
    rating,
    comment: comment?.trim() || undefined,
    photo,
    clientName: booking.clientName,
    createdAt: new Date().toISOString(),
  };

  writeReviews([...reviews, review]);
  return review;
}

/**
 * Avaliações de um barbeiro, da mais recente para a mais antiga.
 *
 * Equivalente futuro: `GET /api/reviews/?barber={id}`
 */
export async function getReviewsByBarber(
  barberId: string,
): Promise<PaginatedResponse<Review>> {
  const results = readReviews()
    .filter((r) => r.barberId === barberId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { count: results.length, next: null, previous: null, results };
}

/** A avaliação de uma marcação, se já tiver sido feita. */
export async function getReviewByBooking(bookingId: string): Promise<Review | null> {
  return readReviews().find((r) => r.bookingId === bookingId) ?? null;
}

/** Todas as avaliações. Usada nos indicadores do painel de administração. */
export async function getAllReviews(): Promise<PaginatedResponse<Review>> {
  const results = readReviews();
  return { count: results.length, next: null, previous: null, results };
}

/**
 * Média das avaliações locais de um barbeiro.
 *
 * Devolve `null` quando ainda não há nenhuma — a interface mostra então a
 * avaliação de demonstração que vem de `src/data/barbers.ts`.
 */
export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
