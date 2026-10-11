'use client';

import { useMemo, useState } from 'react';
import { MONTHS, WEEKDAYS_SHORT, toISODate, parseDate } from '@/lib/format';

/**
 * Calendário de mês, como no passo "Agendamento" do template: cabeçalho com o
 * mês e setas, linha de dias da semana e a grelha, com o dia escolhido num
 * círculo dourado.
 *
 * Não sabe nada de barbeiros nem de horários — recebe `isDayEnabled` e limita-se
 * a desenhar. Assim o mesmo calendário serve para o fluxo e para o painel do
 * barbeiro, se um dia for preciso lá.
 *
 * Datas são sempre `YYYY-MM-DD` em hora local, via `toISODate`/`parseDate`, para
 * não cair no problema de `new Date("2026-10-15")` ser lido como UTC.
 *
 * Acessibilidade: é uma grelha com `role="grid"`. Um dia indisponível continua
 * focável (`aria-disabled` em vez de `disabled`), para que quem navega por
 * teclado perceba que o dia existe mas não está livre, em vez de o saltar sem
 * explicação.
 *
 * Um dia indisponível está isento da regra de contraste, por ser um controlo
 * inactivo, mas mesmo assim não desce abaixo de 3:1: o telemóvel do cliente vai
 * estar à luz do dia, e um dia que não se vê é um dia que não se percebe que
 * existe. Fica claramente mais apagado do que um dia livre, sem desaparecer.
 */

interface CalendarProps {
  /** Dia escolhido, `YYYY-MM-DD`, ou `''` se ainda nenhum. */
  value: string;
  onChange: (isoDate: string) => void;
  /** Primeiro dia que pode ser escolhido, `YYYY-MM-DD`. */
  minDate: string;
  /** Último dia que pode ser escolhido, `YYYY-MM-DD`. */
  maxDate: string;
  /** Diz se o barbeiro trabalha nesse dia. Fora da janela já é tratado aqui. */
  isDayEnabled: (isoDate: string) => boolean;
}

export function Calendar({ value, onChange, minDate, maxDate, isDayEnabled }: CalendarProps) {
  // O mês mostrado começa no do dia escolhido, ou no do primeiro dia possível.
  const initial = parseDate(value || minDate);
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const { weeks, canGoBack, canGoForward } = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

    // Casas vazias antes do dia 1, para que a semana comece no domingo.
    const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(toISODate(new Date(view.year, view.month, day)));
    }
    // Completa a última semana, para a grelha não ficar com buracos no fim.
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    // Só se pode recuar ou avançar se o mês vizinho ainda cair dentro da janela.
    const monthStart = toISODate(first);
    const monthEnd = toISODate(new Date(view.year, view.month, daysInMonth));

    return {
      weeks: rows,
      canGoBack: monthStart > minDate,
      canGoForward: monthEnd < maxDate,
    };
  }, [view, minDate, maxDate]);

  const shift = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <ArrowButton
          direction="back"
          disabled={!canGoBack}
          onClick={() => shift(-1)}
          label="Mês anterior"
        />
        <p aria-live="polite" className="text-sm font-bold text-text">
          {MONTHS[view.month]} {view.year}
        </p>
        <ArrowButton
          direction="forward"
          disabled={!canGoForward}
          onClick={() => shift(1)}
          label="Mês seguinte"
        />
      </div>

      <table role="grid" className="mt-3 w-full table-fixed border-separate border-spacing-1">
        <thead>
          <tr>
            {WEEKDAYS_SHORT.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted"
              >
                {/* Abreviatura visual; o nome por extenso fica para o leitor de ecrã. */}
                <span aria-hidden="true">{day.slice(0, 3)}</span>
                <span className="sr-only">{day}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => (
            <tr key={index}>
              {week.map((iso, position) => {
                if (!iso) return <td key={position} />;

                const withinWindow = iso >= minDate && iso <= maxDate;
                const available = withinWindow && isDayEnabled(iso);
                const selected = iso === value;
                const dayNumber = parseDate(iso).getDate();

                return (
                  <td key={iso} className="p-0">
                    <button
                      type="button"
                      onClick={() => available && onChange(iso)}
                      aria-disabled={!available}
                      aria-pressed={selected}
                      aria-label={`${dayNumber} de ${MONTHS[view.month]}${
                        available ? '' : ', indisponível'
                      }`}
                      className={`tabular flex aspect-square w-full items-center justify-center rounded-full text-sm transition-colors ${
                        selected
                          ? 'bg-gold font-bold text-ink'
                          : available
                            ? 'font-medium text-text hover:bg-surface-2'
                            : 'cursor-not-allowed text-text-muted/70'
                      }`}
                    >
                      {dayNumber}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: 'back' | 'forward';
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-text-muted/30 disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path
          d={direction === 'back' ? 'm12 4-6 6 6 6' : 'm8 4 6 6-6 6'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
