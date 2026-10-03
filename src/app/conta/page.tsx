import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A minha conta',
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return (
    <div data-surface="light" className="min-h-[60vh]">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl">A minha conta</h1>
        <p className="mt-3 text-text-muted">Por construir — etapa (d).</p>
      </div>
    </div>
  );
}
