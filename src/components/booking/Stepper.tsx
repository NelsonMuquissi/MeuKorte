/**
 * Barra de passos dos fluxos de agendamento, como nas referências: círculos
 * dourados ligados por uma linha, com o nome de cada passo por baixo.
 *
 *   - concluído: círculo dourado cheio, com visto; a linha seguinte é dourada
 *   - actual:    anel dourado com um ponto ao centro
 *   - por fazer: anel cinzento
 *
 * Acessibilidade: é uma lista ordenada, o passo actual leva `aria-current`, e
 * cada item diz por extenso em que estado está ("concluído", "actual", "por
 * fazer") num texto só para leitores de ecrã.
 *
 * No telemóvel os nomes não cabem todos, por isso só se mostra o do passo
 * actual; os restantes ficam como círculos. Acima de `sm` aparecem todos.
 */

/** Os passos da jornada do barbeiro ao domicílio. */
export const STEPS = [
  'Serviço',
  'Estilo',
  'Barbeiro',
  'Agendamento',
  'Localização',
  'Confirmação',
] as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Os passos são um parâmetro porque há duas jornadas com nomes e números
 * diferentes: a do domicílio começa no serviço, a do salão começa na casa.
 */
export function Stepper({
  current,
  steps = STEPS,
}: {
  current: number;
  steps?: readonly string[];
}) {
  return (
    <nav aria-label="Passos do agendamento">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const state = done ? 'concluído' : active ? 'actual' : 'por fazer';
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className="relative flex flex-1 flex-col items-center"
              aria-current={active ? 'step' : undefined}
            >
              {/* Linha até ao passo seguinte: do centro deste ao centro do outro. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-3 h-0.5 w-full ${done ? 'bg-gold' : 'bg-border'}`}
                />
              )}

              <span
                className={`relative flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? 'border-gold bg-gold text-ink'
                    : active
                      ? 'border-gold bg-bg'
                      : 'border-border bg-bg'
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                    <path d="m4 8.5 2.5 2.5L12 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : active ? (
                  <span className="size-2.5 rounded-full bg-gold" aria-hidden="true" />
                ) : null}
              </span>

              <span
                className={`mt-2 hidden text-center text-sm sm:block ${
                  active ? 'font-bold text-text' : 'text-text-muted'
                }`}
              >
                {label}
              </span>

              {/* No telemóvel só o passo actual mostra o nome. */}
              {active && (
                <span className="mt-2 whitespace-nowrap text-xs font-bold text-text sm:hidden">
                  {label}
                </span>
              )}

              <span className="sr-only">
                Passo {index + 1} de {steps.length}: {label}, {state}.
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
