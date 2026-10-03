'use client';

/**
 * Acesso às marcações locais a partir de componentes cliente.
 *
 * Existe para que nenhum componente toque no `localStorage` nem no `storage.ts`
 * directamente, e para resolver um problema de hidratação: no servidor não há
 * marcações nenhumas, por isso o primeiro render tem de ser igual ao do servidor
 * e só depois é que os dados entram.
 *
 * Daí o `loading` começar a `true`: enquanto for `true`, a interface mostra o
 * mesmo que o servidor mostrou.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Booking, BookingStatus } from '@/types';
import {
  getBookingsByPhone,
  getAllBookings,
  cancelBooking as cancel,
  updateBookingStatus as updateStatus,
} from '@/services/bookingsService';
import { STORAGE_EVENT } from '@/services/storage';

interface UseLocalBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  /** Volta a ler do armazenamento. */
  refresh: () => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  updateStatus: (id: string, status: BookingStatus) => Promise<void>;
}

/** Vai buscar as marcações: todas, ou só as de um telemóvel. */
function fetchBookings(phone: string | null) {
  return phone === null ? getAllBookings() : getBookingsByPhone(phone);
}

/**
 * @param phone Telemóvel do cliente. Com `null`, devolve todas as marcações —
 *              é o que os painéis de demonstração usam.
 */
export function useLocalBookings(phone: string | null): UseLocalBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quando o telemóvel muda, a lista actual deixa de servir e voltamos ao estado
  // de carregamento. Ajustar o estado durante o render é o padrão recomendado
  // pelo React para isto, e evita um render intermédio com os dados do número
  // anterior.
  const [loadedPhone, setLoadedPhone] = useState(phone);
  if (loadedPhone !== phone) {
    setLoadedPhone(phone);
    setLoading(true);
  }

  /**
   * Primeira leitura, e releitura sempre que muda o telemóvel.
   *
   * O pedido está escrito aqui dentro, e não numa função à parte, para que o
   * `await` fique à vista: todas as actualizações de estado acontecem depois
   * dele, nunca no caminho síncrono do efeito, e por isso não há renders em
   * cascata.
   */
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetchBookings(phone);
        if (!active) return;
        setBookings(response.results);
        setError(null);
      } catch {
        if (!active) return;
        setError('Não foi possível ler as marcações neste dispositivo.');
        setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [phone]);

  /** Releitura a pedido. Usada pelos eventos e depois de cada alteração. */
  const refresh = useCallback(async () => {
    try {
      const response = await fetchBookings(phone);
      setBookings(response.results);
      setError(null);
    } catch {
      setError('Não foi possível ler as marcações neste dispositivo.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // Mantém a lista actualizada quando algo muda noutro separador (`storage`) ou
  // nesta mesma página (o evento próprio de `storage.ts`).
  useEffect(() => {
    const onChange = () => void refresh();
    window.addEventListener(STORAGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(STORAGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  const handleCancel = useCallback(
    async (id: string) => {
      await cancel(id);
      await refresh();
    },
    [refresh],
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      await updateStatus(id, status);
      await refresh();
    },
    [refresh],
  );

  return {
    bookings,
    loading,
    error,
    refresh,
    cancelBooking: handleCancel,
    updateStatus: handleUpdateStatus,
  };
}
