import type { Metadata } from 'next';
import { Crown, Check } from '@/components/ui/Icons';

/**
 * PÁGINA TEMPORÁRIA — comparação de tons de dourado.
 *
 * Existe só para escolher a cor de acção. APAGAR a pasta `src/app/dev/`
 * assim que a decisão estiver tomada.
 *
 * Os tons não usam os tokens do tema de propósito: estão escritos à mão para
 * que se possam ver os quatro lado a lado na mesma página.
 */

export const metadata: Metadata = {
  title: 'Tons de dourado',
  robots: { index: false, follow: false },
};

const INK = '#12171B';

const TONES = [
  {
    key: 'A',
    hex: '#F9CE97',
    name: 'Pêssego claro',
    note: 'O actual. Amostrado do JPEG do template — e é aí que está o problema: a compressão clareia e dessatura.',
    hue: 34, sat: 89, light: 78, contrast: '12,29:1',
  },
  {
    key: 'B',
    hex: '#EFBE7B',
    name: 'Champanhe',
    note: 'Ainda claro, mas já sai do registo pêssego. Mantém o ar suave do template.',
    hue: 35, sat: 78, light: 71, contrast: '10,58:1',
  },
  {
    key: 'C',
    hex: '#E0AC5E',
    name: 'Dourado cheio',
    note: 'O meio-termo. Lê-se como ouro em vez de pêssego, sem ficar pesado.',
    hue: 36, sat: 68, light: 62, contrast: '8,79:1',
  },
  {
    key: 'D',
    hex: '#D4A24C',
    name: 'Latão',
    note: 'O dourado da versão anterior. O mais saturado e escuro dos quatro.',
    hue: 38, sat: 61, light: 56, contrast: '7,79:1',
  },
];

export default function ColoursPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-4xl">Tons de dourado</h1>
        <p className="mt-3 text-text-muted">
          Os quatro aplicados a um botão e ao cartão de Assinatura, sobre o fundo
          real da aplicação. <strong className="text-text">Todos passam o
          contraste mínimo</strong> — o texto sobre o botão fica entre 7,79:1 e
          12,29:1, bem acima dos 4,5:1 exigidos. A escolha é só de aspecto.
        </p>
        <p className="mt-3 text-sm text-text-muted">
          Página temporária. É apagada assim que escolheres.
        </p>
      </header>

      <div className="mt-10 space-y-5">
        {TONES.map((tone) => (
          <section
            key={tone.key}
            className="grid gap-6 rounded-lg border border-border bg-surface p-5 lg:grid-cols-[200px_1fr_300px] lg:items-center"
          >
            {/* Amostra e dados */}
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="size-14 shrink-0 rounded-md"
                  style={{ backgroundColor: tone.hex }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xl font-extrabold">
                    {tone.key}. {tone.name}
                  </p>
                  <p className="tabular text-sm text-text-muted">{tone.hex}</p>
                </div>
              </div>
              <dl className="tabular mt-3 text-xs text-text-muted">
                <div className="flex gap-2">
                  <dt>Matiz</dt><dd>{tone.hue}°</dd>
                  <dt>Sat</dt><dd>{tone.sat}%</dd>
                  <dt>Lum</dt><dd>{tone.light}%</dd>
                </div>
                <div className="mt-1 flex gap-2">
                  <dt>Texto sobre o botão</dt>
                  <dd className="font-bold text-text">{tone.contrast}</dd>
                </div>
              </dl>
            </div>

            {/* Botões */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-md px-7 text-base font-bold"
                  style={{ backgroundColor: tone.hex, color: INK }}
                >
                  Agendar agora
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-[54px] items-center justify-center rounded-md border px-7 text-base font-bold"
                  style={{ borderColor: `${tone.hex}66`, color: tone.hex }}
                >
                  Ver planos
                </button>
              </div>

              {/* O mesmo tom como texto de destaque sobre o fundo escuro */}
              <p className="mt-4 text-2xl font-extrabold">
                O teu barbeiro,{' '}
                <span style={{ color: tone.hex }}>onde estiveres.</span>
              </p>
              <p className="mt-2 text-sm" style={{ color: tone.hex }}>
                Ver planos →
              </p>
            </div>

            {/* Cartão de Assinatura */}
            <div className="rounded-lg border border-border bg-bg p-5">
              <span
                className="flex size-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${tone.hex}1A`, color: tone.hex }}
              >
                <Crown className="size-6" />
              </span>
              <h3 className="mt-4 text-xl">Assinatura</h3>
              <p className="mt-2 text-sm text-text-muted">
                Mantém-te sempre em ordem.
              </p>
              <p className="tabular mt-3 text-3xl font-extrabold" style={{ color: tone.hex }}>
                18 000 Kz
              </p>
              <ul className="mt-3 space-y-1.5">
                {['4 cortes por mês', 'Barba incluída'].map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-text-muted">
                    <Check className="mt-0.5 size-4 shrink-0" style={{ color: tone.hex }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
