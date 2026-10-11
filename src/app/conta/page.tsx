import type { Metadata } from 'next';
import { AccountArea } from '@/components/account/AccountArea';
import { getBarbers } from '@/services/barbersService';

export const metadata: Metadata = {
  title: 'A minha conta',
  // Não há aqui nada que faça sentido num motor de busca, e a página mostra
  // dados de um cliente concreto.
  robots: { index: false, follow: true },
};

/**
 * Área do cliente — o ecrã 9 do template.
 *
 * Server Component fino, como a página de agendamento: carrega os barbeiros no
 * build e entrega-os à área, que é cliente e precisa deles para as fotografias
 * do resumo. Os agendamentos em si são lidos no navegador, porque é lá que
 * vivem — a página continua estática.
 */
export default async function AccountPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div data-surface="light" className="min-h-[70vh]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="sr-only">A minha conta</h1>
        <AccountArea barbers={barbers} />
      </div>
    </div>
  );
}
