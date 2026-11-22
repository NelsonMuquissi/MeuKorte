import Image from 'next/image';
import Link from 'next/link';

/**
 * Logótipo "Korte." — a palavra em tinta escura com o ponto dourado.
 *
 * A arte vem de `Novas_Referencias/Korte. Minimalist Gold-Dot Wordmark.png`,
 * recortada e em duas variantes:
 *
 *   - `korte.png`       — palavra escura, para superfícies claras (o normal)
 *   - `korte-light.png` — palavra branca, para superfícies escuras
 *
 * O ponto é dourado nas duas.
 */

interface LogoProps {
  /** `dark` = palavra escura, para fundo claro. `light` = para fundo escuro. */
  variant?: 'dark' | 'light';
  /** `lg` para o rodapé. */
  size?: 'header' | 'lg';
  className?: string;
  /** Com `false`, devolve só a imagem, sem a ligação à página inicial. */
  asLink?: boolean;
}

export function Logo({
  variant = 'dark',
  size = 'header',
  className = '',
  asLink = true,
}: LogoProps) {
  const image = (
    <Image
      src={variant === 'light' ? '/brand/korte-light.png' : '/brand/korte.png'}
      alt="Korte."
      width={366}
      height={96}
      priority
      className={size === 'lg' ? 'h-10 w-auto' : 'h-7 w-auto sm:h-8'}
    />
  );

  if (!asLink) return <span className={className}>{image}</span>;

  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Korte., página inicial">
      {image}
    </Link>
  );
}
