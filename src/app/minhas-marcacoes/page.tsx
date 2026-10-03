import type { Metadata } from 'next';
import { MyBookings } from '@/components/booking/MyBookings';

export const metadata: Metadata = {
  title: 'As minhas marcações',
  description:
    'Consulta, cancela e avalia as tuas marcações no Meu Korte.',
  alternates: { canonical: '/minhas-marcacoes' },
  // Página pessoal: não há nada aqui que valha a pena indexar.
  robots: { index: false, follow: true },
};

export default function MyBookingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <h1 className="text-4xl sm:text-5xl">As minhas marcações</h1>
        <p className="mt-3 text-text-muted">
          Vê o que tens marcado, cancela se precisares e avalia os cortes já feitos.
        </p>
      </header>

      <MyBookings />

      {/* Limitação desta fase, dita sem alarmismo mas sem a esconder. */}
      <p className="mt-10 rounded-md border border-border bg-surface p-4 text-xs text-text-muted">
        Nesta versão, as marcações ficam guardadas apenas neste dispositivo. Se
        mudares de telemóvel ou limpares os dados do navegador, deixas de as ver
        aqui — mas o teu barbeiro continua a tê-las. Em caso de dúvida, fala
        connosco pelo WhatsApp.
      </p>
    </div>
  );
}
