/**
 * Rotas que são um fluxo fechado.
 *
 * Nestas páginas o cliente está a meio de uma tarefa com princípio e fim, e
 * tudo o que o convide a sair compete com o passo que tem à frente. Por isso o
 * cabeçalho encolhe (perde a navegação e o "Agendar agora") e o botão
 * flutuante do WhatsApp desaparece — é também assim nos ecrãs do template.
 *
 * Está num ficheiro próprio para que o cabeçalho e o botão não possam ficar com
 * listas diferentes.
 */
export const FLOW_ROUTES = ['/agendar'];

/** A rota actual é um fluxo fechado? */
export function isFlowRoute(pathname: string): boolean {
  return FLOW_ROUTES.includes(pathname);
}
