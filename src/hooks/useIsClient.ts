'use client';

import { useSyncExternalStore } from 'react';

/** Nada muda nunca, por isso a subscrição não faz nada. */
const subscribe = () => () => {};

/**
 * Diz se já estamos no navegador.
 *
 * Serve para tudo o que não existe no servidor — `localStorage`, a hora actual,
 * `window` — sem provocar erros de hidratação e sem chamar `setState` dentro de
 * um `useEffect`.
 *
 * O `useSyncExternalStore` recebe dois instantâneos: o do servidor devolve
 * `false` e o do cliente devolve `true`. O primeiro render do cliente usa o
 * instantâneo do servidor, por isso é igual ao HTML recebido; logo a seguir o
 * React volta a renderizar já com `true`. É o mesmo efeito que teria um
 * `useEffect` com `setState`, mas é o React a tratar da transição.
 *
 * Usar assim:
 *
 * ```ts
 * const isClient = useIsClient();
 * const today = useMemo(() => (isClient ? toISODate(new Date()) : ''), [isClient]);
 * ```
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,  // no cliente
    () => false, // no servidor e no primeiro render do cliente
  );
}
