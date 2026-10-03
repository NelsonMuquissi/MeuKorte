'use client';

import { useState } from 'react';

/**
 * Acordeão das perguntas frequentes.
 *
 * É a única parte cliente da página inicial. Os textos são construídos no
 * servidor a partir das regras de `business.ts` e chegam aqui já prontos, para
 * que as regras continuem a ter um só sítio.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export function Faq({ items }: { items: FaqItem[] }) {
  // Primeira pergunta aberta: dá a entender que as outras também abrem.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-painel-${index}`;
        const buttonId = `faq-botao-${index}`;

        return (
          <li key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-sans text-base font-semibold normal-case tracking-normal text-text transition-colors hover:bg-surface-2 sm:px-6"
              >
                {item.question}
                <svg
                  viewBox="0 0 20 20"
                  className={`size-5 shrink-0 text-primary transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  <path
                    d="m5 7.5 5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h3>
            {/* Mantido no DOM e escondido, para que o Ctrl+F e os motores de
                busca encontrem as respostas mesmo com o painel fechado. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-4 pb-5 text-text-muted sm:px-6"
            >
              {item.answer}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
