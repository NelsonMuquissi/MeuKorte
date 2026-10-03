import type { Metadata } from 'next';
import { PinGate } from '@/components/ui/PinGate';
import { AdminPanel } from '@/components/booking/AdminPanel';
import { getBarbers } from '@/services/barbersService';

export const metadata: Metadata = {
  title: 'Administração',
  description: 'Área de demonstração do painel administrativo.',
  // Demonstração: fora dos motores de busca.
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPage() {
  const { results: barbers } = await getBarbers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <PinGate
        title="Administração"
        description="Demonstração do painel de gestão da plataforma."
      >
        <header className="mb-8">
          <h1 className="text-4xl">Administração</h1>
          <p className="mt-2 text-text-muted">
            Marcações, indicadores do teste e comissão estimada.
          </p>
        </header>
        <AdminPanel barbers={barbers} />
      </PinGate>
    </div>
  );
}
