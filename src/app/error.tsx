'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

/**
 * Limite de erro da aplicação.
 *
 * Tem de ser um componente cliente: é o React que o monta quando um render
 * rebenta. O `reset()` tenta renderizar outra vez o ramo que falhou, o que
 * costuma chegar para erros passageiros.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Na fase Django isto passa a ser enviado para um serviço de registo.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-cancelled-tint text-cancelled">
        <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
          <path d="M12 8v5m0 3.5v.01" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>

      <h1 className="mt-5 text-3xl">Alguma coisa correu mal</h1>
      <p className="mt-3 text-text-muted">
        Tenta outra vez. Se continuar, fala connosco pelo WhatsApp — as tuas
        marcações não se perderam.
      </p>

      {error.digest && (
        <p className="tabular mt-2 text-xs text-text-muted">
          Referência: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Tentar outra vez</Button>
        <ButtonLink href="/" variant="secondary">
          Voltar ao início
        </ButtonLink>
      </div>
    </div>
  );
}
