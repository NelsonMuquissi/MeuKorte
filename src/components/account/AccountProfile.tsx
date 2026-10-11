'use client';

import { useMemo, useState } from 'react';
import { useIsClient } from '@/hooks/useIsClient';
import { ADDRESS_SLOTS, getSavedAddress, saveAddress } from '@/services/profileService';
import { Button } from '@/components/ui/Button';
import { MapPin } from '@/components/ui/Icons';
import { formatPhone } from '@/lib/format';

/**
 * "Os meus dados" — o que a aplicação sabe sobre o cliente neste dispositivo.
 *
 * É pouco e é de propósito: enquanto não há contas no Django, a identificação é
 * o telemóvel e mais nada. Mostrar aqui campos de conta que não existem seria
 * prometer uma conta que ninguém tem.
 *
 * As moradas são as mesmas que o passo de localização do fluxo usa, pelo mesmo
 * serviço — guardar aqui é guardar lá.
 */
export function AccountProfile({
  name,
  phone,
  onChangePhone,
}: {
  name: string | null;
  phone: string;
  onChangePhone: () => void;
}) {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl sm:text-3xl">Os meus dados</h2>
        <p className="mt-1.5 text-text-muted">
          Guardados só neste telemóvel. Não são enviados para lado nenhum.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h3 className="text-base font-bold text-text">Identificação</h3>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-text-muted">Nome</dt>
            <dd className="font-medium text-text">{name ?? '—'}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-text-muted">Telemóvel</dt>
            <dd className="tabular font-medium text-text">{formatPhone(phone)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-text-muted">
          O nome e o telemóvel são os do último agendamento. Mudam quando
          agendares com outros.
        </p>
        <Button variant="secondary" size="sm" onClick={onChangePhone} className="mt-3">
          Usar outro número
        </Button>
      </section>

      <AddressBook />
    </div>
  );
}

/**
 * As moradas guardadas, editáveis.
 *
 * Existe aqui porque é o sítio onde se espera encontrá-las — no fluxo só dava
 * para guardar, nunca para corrigir uma morada mal escrita sem agendar outra
 * vez.
 */
function AddressBook() {
  const isClient = useIsClient();

  const stored = useMemo(() => {
    const entries: Record<string, string> = {};
    if (!isClient) return entries;
    for (const slot of ADDRESS_SLOTS) {
      const found = getSavedAddress(slot.id);
      if (found) entries[slot.id] = found.address;
    }
    return entries;
  }, [isClient]);

  // O que foi editado nesta visita, e o que já foi gravado nesta visita.
  //
  // São dois mapas e não um: o `stored` é um `useMemo` que lê o armazenamento
  // uma vez e nunca mais: depois de gravar, ele continua a devolver o valor
  // antigo. Sem o `committed`, o campo ficava para sempre com ar de "por
  // gravar" — o botão nunca se desactivava e a confirmação nunca aparecia.
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [committed, setCommitted] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const valueOf = (id: string) => edited[id] ?? committed[id] ?? stored[id] ?? '';
  /** O valor que está mesmo gravado neste momento. */
  const baselineOf = (id: string) => committed[id] ?? stored[id] ?? '';

  const commit = (id: string, label: string) => {
    const value = valueOf(id).trim();
    saveAddress(id, label, value);
    setCommitted((c) => ({ ...c, [id]: value }));
    setEdited((c) => ({ ...c, [id]: value }));
    setSaved(id);
  };

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-base font-bold text-text">As minhas moradas</h3>
      <p className="mt-1 text-sm text-text-muted">
        Ficam à mão no passo da localização, quando escolheres domicílio.
      </p>

      <div className="mt-4 space-y-5">
        {ADDRESS_SLOTS.map((slot) => {
          const id = `morada-${slot.id}`;
          const changed = valueOf(slot.id) !== baselineOf(slot.id);

          return (
            <div key={slot.id}>
              <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold text-text">
                <MapPin className="size-4 text-primary-dim" />
                {slot.label}
              </label>
              <input
                id={id}
                value={valueOf(slot.id)}
                onChange={(e) => {
                  setEdited((c) => ({ ...c, [slot.id]: e.target.value }));
                  setSaved(null);
                }}
                autoComplete="street-address"
                placeholder="Rua, prédio, andar, ponto de referência"
                className="mt-1.5 min-h-[48px] w-full rounded-md border border-border bg-bg px-3 text-base text-text placeholder:text-text-muted/60 focus:border-primary-dim"
              />
              <div className="mt-2 flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => commit(slot.id, slot.label)}
                  disabled={!changed}
                >
                  Guardar
                </Button>
                {saved === slot.id && !changed && (
                  <span role="status" className="text-sm text-confirmed">
                    Guardada.
                  </span>
                )}
                {/* Deixar em branco e guardar é como se apaga — dito, para não
                    ser preciso adivinhar nem ter um botão só para isso. */}
                {valueOf(slot.id) === '' && baselineOf(slot.id) && (
                  <span className="text-xs text-text-muted">
                    Guardar em branco apaga a morada.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
