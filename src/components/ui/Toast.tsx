'use client';

/**
 * Avisos curtos.
 *
 * Ficam numa região `aria-live`, para que o leitor de ecrã anuncie a mensagem
 * sem o utilizador ter de a procurar. Os erros são anunciados de imediato
 * (`assertive`); os sucessos esperam pela pausa seguinte (`polite`).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'error';

interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastContextValue {
  showToast: (text: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Mostra um aviso. Tem de haver um `ToastProvider` acima na árvore. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast tem de ser usado dentro de um ToastProvider.');
  }
  return context;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = nextId++;
    setMessages((current) => [...current, { id, kind, text }]);
    window.setTimeout(() => {
      setMessages((current) => current.filter((m) => m.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // Fica acima do botão do WhatsApp para não o tapar.
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            role={message.kind === 'error' ? 'alert' : 'status'}
            aria-live={message.kind === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto w-full max-w-sm rounded-md border px-4 py-3 text-sm font-medium shadow-lg ${
              message.kind === 'error'
                ? 'border-cancelled/40 bg-cancelled-tint text-cancelled'
                : 'border-confirmed/40 bg-confirmed-tint text-confirmed'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
