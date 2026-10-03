'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Barber, BookingStatus, Review } from '@/types';
import { useLocalBookings } from '@/hooks/useLocalBookings';
import { getAllReviews } from '@/services/reviewsService';
import { STORAGE_EVENT } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { StatusBadge, statusLabel } from '@/components/ui/StatusBadge';
import {
  formatKz,
  formatDateShort,
  formatPhone,
  formatLocationType,
} from '@/lib/format';
import { COMMISSION, MVP_GOALS } from '@/config/business';

/**
 * Painel administrativo (demonstração).
 *
 * Mostra o que o plano do MVP pede: todas as marcações, os indicadores face às
 * metas dos 90 dias, a comissão estimada e a exportação dos dados.
 *
 * Os números saem do `localStorage` deste dispositivo, por isso servem para
 * demonstrar o painel, não para medir o negócio. A medição a sério chega com o
 * backend.
 */

const STATUSES: BookingStatus[] = ['pendente', 'confirmada', 'concluida', 'cancelada'];

export function AdminPanel({ barbers }: { barbers: Barber[] }) {
  const { bookings, loading } = useLocalBookings(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [status, setStatus] = useState<BookingStatus | 'todos'>('todos');
  const [barberId, setBarberId] = useState<string>('todos');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    async function load() {
      const { results } = await getAllReviews();
      setReviews(results);
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(STORAGE_EVENT, onChange);
    return () => window.removeEventListener(STORAGE_EVENT, onChange);
  }, []);

  const filtered = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (status === 'todos' || b.status === status) &&
          (barberId === 'todos' || b.barberId === barberId) &&
          (fromDate === '' || b.date >= fromDate) &&
          (toDate === '' || b.date <= toDate),
      ),
    [bookings, status, barberId, fromDate, toDate],
  );

  /** Indicadores face às metas do MVP. Calculados sobre TODAS as marcações. */
  const metrics = useMemo(() => {
    // Cada telemóvel distinto conta como um utilizador — é a única identificação
    // que existe enquanto não há contas.
    const uniqueUsers = new Set(bookings.map((b) => b.clientPhone)).size;

    const cancelled = bookings.filter((b) => b.status === 'cancelada').length;
    const cancellationRate = bookings.length > 0 ? cancelled / bookings.length : 0;

    // Satisfação: proporção de avaliações de 4 ou 5 estrelas.
    const satisfied = reviews.filter((r) => r.rating >= 4).length;
    const satisfaction = reviews.length > 0 ? satisfied / reviews.length : null;

    // A comissão só se conta sobre o que foi mesmo prestado.
    const completed = bookings.filter((b) => b.status === 'concluida');
    const revenue = completed.reduce((sum, b) => sum + b.price, 0);

    return {
      uniqueUsers,
      totalBookings: bookings.length,
      cancellationRate,
      satisfaction,
      reviewCount: reviews.length,
      revenue,
      commission: Math.round(revenue * COMMISSION.rate),
      activeBarbers: new Set(bookings.map((b) => b.barberId)).size,
    };
  }, [bookings, reviews]);

  /**
   * Exporta as marcações filtradas para CSV.
   *
   * Separador `;` e BOM no início, porque é assim que o Excel em português abre
   * o ficheiro com as colunas separadas e os acentos certos.
   */
  function exportCsv() {
    const headers = [
      'ID', 'Data', 'Hora', 'Barbeiro', 'Serviço', 'Duração (min)',
      'Local', 'Morada', 'Cliente', 'Telemóvel', 'Estado',
      'Valor (Kz)', 'Comissão (Kz)', 'Criada em',
    ];

    const escape = (value: string | number | undefined) => {
      const text = String(value ?? '');
      return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const rows = filtered.map((b) =>
      [
        b.id, b.date, b.time, b.barberName, b.serviceName, b.durationMinutes,
        formatLocationType(b.locationType), b.address, b.clientName, b.clientPhone,
        statusLabel(b.status), b.price,
        b.status === 'concluida' ? Math.round(b.price * COMMISSION.rate) : 0,
        b.createdAt,
      ].map(escape).join(';'),
    );

    const csv = `﻿${headers.join(';')}\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `meukorte-marcacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />;
  }

  return (
    <div className="space-y-10">
      {/* ---- Indicadores face às metas ---------------------------------- */}
      <section>
        <h2 className="text-2xl">Metas do MVP</h2>
        <p className="mt-1 text-sm text-text-muted">
          Período de teste de {MVP_GOALS.testPeriodDays} dias.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Barbeiros com marcações"
            value={metrics.activeBarbers}
            goal={MVP_GOALS.barbers}
            suffix={` de ${MVP_GOALS.barbers}`}
          />
          <Metric
            label="Utilizadores únicos"
            value={metrics.uniqueUsers}
            goal={MVP_GOALS.users}
            suffix={` de ${MVP_GOALS.users}`}
            hint="Telemóveis distintos"
          />
          <Metric
            label="Marcações"
            value={metrics.totalBookings}
            goal={MVP_GOALS.bookings}
            suffix={` de ${MVP_GOALS.bookings}`}
          />
          <Metric
            label="Satisfação"
            value={metrics.satisfaction === null ? null : Math.round(metrics.satisfaction * 100)}
            goal={MVP_GOALS.satisfactionRate * 100}
            suffix="%"
            hint={
              metrics.reviewCount === 0
                ? 'Sem avaliações ainda'
                : `${metrics.reviewCount} avaliações · meta ${MVP_GOALS.satisfactionRate * 100}%`
            }
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Taxa de cancelamento"
            value={Math.round(metrics.cancellationRate * 100)}
            suffix="%"
            inverted
          />
          <Metric
            label="Valor dos serviços concluídos"
            value={metrics.revenue}
            isCurrency
          />
          <Metric
            label={`Comissão estimada (${Math.round(COMMISSION.rate * 100)}%)`}
            value={metrics.commission}
            isCurrency
            hint="Só sobre marcações concluídas"
          />
        </div>

        <p className="mt-3 text-xs text-text-muted">
          Os números vêm do armazenamento deste dispositivo. Servem para
          demonstrar o painel, não para medir o negócio.
        </p>
      </section>

      {/* ---- Marcações ---------------------------------------------------- */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl">Marcações</h2>
          <Button size="sm" variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV ({filtered.length})
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            id="filtro-estado"
            label="Estado"
            value={status}
            onChange={(v) => setStatus(v as BookingStatus | 'todos')}
            options={[
              { value: 'todos', label: 'Todos' },
              ...STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
            ]}
          />
          <Select
            id="filtro-barbeiro"
            label="Barbeiro"
            value={barberId}
            onChange={setBarberId}
            options={[
              { value: 'todos', label: 'Todos' },
              ...barbers.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <DateInput id="filtro-de" label="De" value={fromDate} onChange={setFromDate} />
          <DateInput id="filtro-ate" label="Até" value={toDate} onChange={setToDate} />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-8 text-center text-text-muted">
            {bookings.length === 0
              ? 'Ainda não há marcações neste dispositivo. Faz uma em /marcar para ver o painel a funcionar.'
              : 'Nenhuma marcação com estes filtros.'}
          </p>
        ) : (
          <>
            {/* Tabela em ecrãs largos */}
            <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border lg:block">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left">
                  <tr>
                    <Th>Quando</Th>
                    <Th>Cliente</Th>
                    <Th>Barbeiro</Th>
                    <Th>Serviço</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">Valor</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {filtered.map((booking) => (
                    <tr key={booking.id}>
                      <Td>
                        <span className="tabular">
                          {formatDateShort(booking.date)} · {booking.time}
                        </span>
                      </Td>
                      <Td>
                        <span className="block text-text">{booking.clientName}</span>
                        <span className="tabular block text-xs text-text-muted">
                          {formatPhone(booking.clientPhone)}
                        </span>
                      </Td>
                      <Td>{booking.barberName}</Td>
                      <Td>
                        <span className="block">{booking.serviceName}</span>
                        <span className="block text-xs text-text-muted">
                          {formatLocationType(booking.locationType)}
                        </span>
                      </Td>
                      <Td><StatusBadge status={booking.status} /></Td>
                      <Td className="tabular text-right font-semibold text-primary">
                        {formatKz(booking.price)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards no telemóvel — uma tabela de seis colunas não cabe a 360px */}
            <ul className="mt-4 space-y-3 lg:hidden">
              {filtered.map((booking) => (
                <li key={booking.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-text">{booking.clientName}</p>
                      <p className="tabular text-sm text-text-muted">
                        {formatPhone(booking.clientPhone)}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="tabular mt-2 text-sm text-text-muted">
                    {formatDateShort(booking.date)} às {booking.time} · {booking.barberName}
                  </p>
                  <p className="mt-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-text-muted">{booking.serviceName}</span>
                    <span className="tabular font-semibold text-primary">
                      {formatKz(booking.price)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

/* ---- Peças internas ----------------------------------------------------- */

function Metric({
  label,
  value,
  goal,
  suffix = '',
  hint,
  isCurrency = false,
  inverted = false,
}: {
  label: string;
  value: number | null;
  goal?: number;
  suffix?: string;
  hint?: string;
  isCurrency?: boolean;
  /** Para indicadores em que menos é melhor, como o cancelamento. */
  inverted?: boolean;
}) {
  const reached = goal !== undefined && value !== null && (inverted ? value <= goal : value >= goal);
  const progress = goal !== undefined && value !== null
    ? Math.min(100, Math.round((value / goal) * 100))
    : null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="tabular mt-1 font-display text-3xl text-text">
        {value === null ? '—' : isCurrency ? formatKz(value) : value}
        {value !== null && !isCurrency && (
          <span className="text-lg text-text-muted">{suffix}</span>
        )}
      </p>

      {progress !== null && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${progress}% da meta`}
        >
          <div
            className={`h-full rounded-full ${reached ? 'bg-confirmed' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 min-h-[44px] w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-text"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 min-h-[44px] w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-text"
      />
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-4 py-3 font-semibold text-text ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top text-text-muted ${className}`}>{children}</td>;
}
