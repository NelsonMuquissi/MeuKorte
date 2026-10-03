import Image from 'next/image';
import Link from 'next/link';

/**
 * Logótipo do Meu Korte.
 *
 * A arte vem de `docs/template/image1.png`, com o fundo preto removido e em
 * duas variantes, porque o monograma é prateado e a palavra é branca:
 *
 *   - `logo-wordmark.png`      — arte clara, para superfícies escuras
 *   - `logo-wordmark-dark.png` — arte escura, para superfícies claras
 *
 * A versão `wordmark` não traz a assinatura "O teu barbeiro, à tua maneira",
 * que a esta altura ficaria ilegível. A assinatura aparece no `full`, usado
 * onde o logótipo é grande (rodapé).
 */

interface LogoProps {
  /** `light` = arte clara para fundo escuro (o caso normal). */
  variant?: 'light' | 'dark';
  /** `full` inclui a assinatura. */
  size?: 'header' | 'full';
  className?: string;
  /** Com `false`, devolve só a imagem, sem a ligação à página inicial. */
  asLink?: boolean;
}

export function Logo({
  variant = 'light',
  size = 'header',
  className = '',
  asLink = true,
}: LogoProps) {
  const isFull = size === 'full';
  const file = isFull
    ? variant === 'dark' ? '/brand/logo-dark.png' : '/brand/logo.png'
    : variant === 'dark' ? '/brand/logo-wordmark-dark.png' : '/brand/logo-wordmark.png';

  const image = (
    <Image
      src={file}
      alt="Meu Korte"
      width={244}
      height={isFull ? 134 : 115}
      priority
      className={isFull ? 'h-16 w-auto sm:h-20' : 'h-8 w-auto sm:h-9'}
    />
  );

  if (!asLink) return <span className={className}>{image}</span>;

  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Meu Korte, página inicial">
      {image}
    </Link>
  );
}
