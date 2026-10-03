'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useIsClient } from '@/hooks/useIsClient';
import { DEMO_PIN } from '@/config/business';
import { Button } from '@/components/ui/Button';

/**
 * ⚠️ ISTO NÃO É SEGURANÇA.
 *
 * O PIN está em `business.ts`, que é compilado para o pacote JavaScript enviado
 * ao navegador. Qualquer pessoa o lê abrindo as ferramentas de programador, e
 * qualquer pessoa chega ao conteúdo escrevendo-o. Não protege absolutamente nada.
 *
 * Só serve para que um visitante casual que vá parar a `/admin` não caia logo
 * no painel, enquanto as demonstrações estão no ar para mostrar o produto a
 * potenciais barbeiros parceiros.
 *
 * FASE DJANGO: isto é substituído por autenticação a sério — sessão no servidor,
 * permissões por utilizador e verificação em cada pedido à API. Até lá, NUNCA
 * pôr aqui dados reais de clientes.
 */
export function PinGate({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  // `undefined` = ainda não se destrancou nesta sessão de React; o valor vem do
  // armazenamento. Depois de alguém acertar no PIN passa a `true`.
  const [unlockedNow, setUnlockedNow] = useState<boolean | undefined>(undefined);

  const isClient = useIsClient();

  /**
   * Mantém a sessão aberta enquanto o separador estiver aberto. `sessionStorage`
   * e não `localStorage`, para a demonstração voltar a pedir o PIN depois de fechar.
   */
  const wasUnlocked = useMemo(() => {
    if (!isClient) return false;
    try {
      return window.sessionStorage.getItem('meukorte:demo-unlocked') === '1';
    } catch {
      return false; // armazenamento indisponível — pede o PIN na mesma
    }
  }, [isClient]);

  const unlocked = unlockedNow ?? wasUnlocked;
  // No servidor e no primeiro render do cliente ainda não sabemos o estado.
  const ready = isClient;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (value === DEMO_PIN) {
      setUnlockedNow(true);
      setWrong(false);
      try {
        window.sessionStorage.setItem('meukorte:demo-unlocked', '1');
      } catch {
        /* segue na mesma */
      }
    } else {
      setWrong(true);
      setValue('');
    }
  }

  if (!ready) {
    return <div className="min-h-[50vh]" aria-busy="true" />;
  }

  if (unlocked) {
    return (
      <>
        {/* O aviso fica visível dentro do painel, não só no código. */}
        <p className="mb-6 rounded-md border border-pending/40 bg-pending-tint p-3 text-sm text-pending">
          <strong>Demonstração.</strong> Este painel não tem segurança nenhuma: o
          PIN está no código do site e serve só para o esconder de visitantes
          casuais. Os dados são os deste dispositivo. A autenticação a sério chega
          com o backend em Django.
        </p>
        {children}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">{description}</p>

      <form onSubmit={handleSubmit} className="mt-6">
        <label htmlFor="pin" className="block text-sm font-semibold text-text">
          PIN de demonstração
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setWrong(false);
          }}
          aria-invalid={wrong || undefined}
          aria-describedby={wrong ? 'pin-erro' : undefined}
          className={`tabular mt-1.5 min-h-[48px] w-full rounded-md border bg-surface-2 px-3 text-center text-xl tracking-[0.3em] text-text ${
            wrong ? 'border-cancelled' : 'border-border focus:border-primary-dim'
          }`}
        />
        {wrong && (
          <p id="pin-erro" role="alert" className="mt-2 text-sm text-cancelled">
            PIN errado.
          </p>
        )}

        <Button type="submit" className="mt-4 w-full" disabled={value.length === 0}>
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-xs text-text-muted">
        Esta é uma área de demonstração, feita para mostrar a plataforma a
        barbeiros parceiros. Não substitui autenticação e não contém dados reais.
      </p>
    </div>
  );
}
