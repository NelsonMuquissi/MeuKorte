/**
 * Barra de passos do fluxo de agendamento, como no template: círculos ligados
 * por uma linha, com o nome de cada passo por baixo.
 *
 * Acessibilidade: é uma lista ordenada, o passo actual leva `aria-current`, e
 * cada item diz por extenso em que estado está ("concluído", "actual", "por
 * fazer") num texto só para leitores de ecrã. Sem isso, quem não vê os
 * círculos não teria como saber onde está.
 *
 * No telemóvel os nomes não cabem todos, por isso só se mostra o do passo
 * actual; os restantes ficam como círculos. Acima de `sm` aparecem todos.
 */

export const STEPS = [
  'Serviço',
  'Estilo',
  'Barbeiro',
  'Agendamento',
  'Localização',
  'Confirmação',
] as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

export function Stepper({ current }: { current: StepIndex }) {
  return (
    <nav aria-label="Passos do agendamento">
      <ol className="flex items-start">
        {STEPS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const state = done ? 'concluído' : active ? 'actual' : 'por fazer';

          return (
            <li
              key={label}
              className="flex flex-1 flex-col items-center last:flex-none"
              aria-current={active ? 'step' : undefined}
            >
              <div className="flex w-full items-center">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? 'border-text bg-text text-bg'
                      : active
                        ? 'border-text bg-bg'
                        : 'border-border bg-bg'
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                      <path d="m4 8.5 2.5 2.5L12 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : active ? (
                    <span className="size-2.5 rounded-full bg-text" aria-hidden="true" />
                  ) : null}
                </span>

                {/* Linha de ligação, excepto depois do último. */}
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-px flex-1 ${done ? 'bg-text' : 'bg-border'}`}
                  />
                )}
              </div>

              <span
                className={`mt-2 hidden text-center text-xs sm:block ${
                  active ? 'font-bold text-text' : 'text-text-muted'
                } ${index === STEPS.length - 1 ? '' : '-ml-6'}`}
              >
                {label}
              </span>

              {/* No telemóvel só o passo actual mostra o nome. */}
              {active && (
                <span className="mt-2 text-xs font-bold text-text sm:hidden">
                  {label}
                </span>
              )}

              <span className="sr-only">
                Passo {index + 1} de {STEPS.length}: {label}, {state}.
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
