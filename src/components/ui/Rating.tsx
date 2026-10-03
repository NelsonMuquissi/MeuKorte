/**
 * Estrelas de avaliação.
 *
 * As estrelas são decorativas; o valor vai em texto no `aria-label`, para quem
 * usa leitor de ecrã não ter de contar formas.
 */
interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
}

export function Rating({ value, count, size = 'sm' }: RatingProps) {
  const px = size === 'sm' ? 'size-3.5' : 'size-4.5';
  const label = count !== undefined
    ? `${value} em 5 estrelas, ${count} avaliações`
    : `${value} em 5 estrelas`;

  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            viewBox="0 0 20 20"
            className={`${px} ${star <= Math.round(value) ? 'text-primary' : 'text-border'}`}
            fill="currentColor"
          >
            <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
          </svg>
        ))}
      </span>
      <span className="tabular text-sm font-semibold text-text" aria-hidden="true">
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-sm text-text-muted" aria-hidden="true">
          ({count})
        </span>
      )}
    </span>
  );
}
