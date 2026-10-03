import type { Metadata } from 'next';
import { PinGate } from '@/components/ui/PinGate';
import { BarberPanel } from '@/components/booking/BarberPanel';
import { getBarbers } from '@/services/barbersService';

export const metadata: Metadata = {
  title: 'Painel do barbeiro',
  description: 'Área de demonstração do painel do barbeiro.',
  // Demonstração: fora dos motores de busca.
  robots: { index: false, follow: false, nocache: true },
};

export default async function BarberPanelPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <PinGate
        title="Painel do barbeiro"
        description="Demonstração de como um barbeiro parceiro gere as suas marcações."
      >
        <header className="mb-8">
          <h1 className="text-4xl">Painel do barbeiro</h1>
          <p className="mt-2 text-text-muted">
            Pedidos recebidos, agenda do dia e da semana.
          </p>
        </header>
        <BarberPanel barbers={barbers} />
      </PinGate>
    </div>
  );
}
