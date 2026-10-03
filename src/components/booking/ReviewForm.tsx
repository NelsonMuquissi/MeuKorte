'use client';

import { useRef, useState } from 'react';
import type { Booking } from '@/types';
import { createReview } from '@/services/reviewsService';
import { compressImage, ImageError } from '@/lib/image';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

/**
 * Formulário de avaliação de uma marcação concluída.
 *
 * Estrelas de 1 a 5, comentário opcional e foto do corte — a "função adicional"
 * pedida no briefing (update de imagem do cliente).
 */
export function ReviewForm({
  booking,
  open,
  onClose,
  onDone,
}: {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      // Comprimida no navegador antes de ser guardada: uma foto de telemóvel em
      // bruto não cabe no localStorage.
      setPhoto(await compressImage(file));
    } catch (error) {
      showToast(
        error instanceof ImageError ? error.message : 'Não foi possível ler a imagem.',
        'error',
      );
    } finally {
      setProcessing(false);
      // Permite escolher o mesmo ficheiro outra vez depois de o remover.
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await createReview(booking.id, rating, comment, photo ?? undefined);
      showToast('Obrigado pela avaliação!');
      onDone();
      onClose();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Não foi possível avaliar.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Avaliar o corte">
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-text-muted">
          {booking.serviceName} com {booking.barberName}.
        </p>

        {/* Estrelas. Um radiogroup de verdade, para funcionar com teclado. */}
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-text">
            Como correu? <span className="text-cancelled">*</span>
          </legend>
          <div
            className="mt-2 flex gap-1"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                aria-pressed={rating === star}
                className="rounded-md p-1"
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`size-9 transition-colors ${
                    star <= (hovered || rating) ? 'text-primary' : 'text-border'
                  }`}
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                </svg>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5">
          <label htmlFor="comentario" className="block text-sm font-semibold text-text">
            Comentário <span className="font-normal text-text-muted">(opcional)</span>
          </label>
          <textarea
            id="comentario"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="O que correu bem? O que podia ser melhor?"
            className="mt-1.5 w-full rounded-md border border-border bg-surface-2 p-3 text-base text-text placeholder:text-text-muted/60 focus:border-primary-dim"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="foto" className="block text-sm font-semibold text-text">
            Foto do corte <span className="font-normal text-text-muted">(opcional)</span>
          </label>
          <input
            ref={fileInput}
            id="foto"
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            disabled={processing}
            className="mt-1.5 block w-full text-sm text-text-muted file:mr-3 file:min-h-[40px] file:cursor-pointer file:rounded-md file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:font-semibold file:text-text"
          />
          <p className="mt-1.5 text-xs text-text-muted">
            A foto é reduzida no telemóvel e fica guardada só neste dispositivo.
          </p>

          {processing && (
            <p className="mt-2 text-sm text-text-muted">A preparar a imagem…</p>
          )}

          {photo && (
            <div className="mt-3 flex items-start gap-3">
              {/* Imagem local em base64 — o next/image não a optimiza. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="Pré-visualização do corte"
                className="h-28 w-28 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-sm font-semibold text-cancelled underline-offset-4 hover:underline"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={rating === 0 || submitting} className="flex-1">
            {submitting ? 'A enviar…' : 'Enviar avaliação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
