import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-7xl text-primary">404</p>
      <h1 className="mt-3 text-3xl">Esta página não existe</h1>
      <p className="mt-3 text-text-muted">
        O link pode estar errado ou a página pode ter mudado de sítio.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Voltar ao início</ButtonLink>
        <ButtonLink href="/barbeiros" variant="secondary">
          Ver barbeiros
        </ButtonLink>
      </div>
    </div>
  );
}
