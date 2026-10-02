import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Ticket, TicketStatus, formatCurrency, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';

export const TicketsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');

  const { data: ticketsResult, isLoading } = useQuery({
    queryKey: ['admin', 'tickets', page, search, statusFilter],
    queryFn: () =>
      api.ticket.list({
        page,
        limit: 15,
        ticketNumber: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const columns: Column<Ticket>[] = [
    {
      header: 'Ticket #',
      cell: (t) => (
        <span className="font-mono font-bold text-slate-100">
          #{t.ticketNumber}
        </span>
      ),
    },
    {
      header: 'Game',
      cell: (t) => (
        <span className="font-semibold text-slate-200">
          {t.lottery?.name || 'Lottery'}
        </span>
      ),
    },
    {
      header: 'Selected Numbers',
      cell: (t) => (
        <div className="flex items-center gap-1">
          {t.selectedNumbers?.map((n) => (
            <span
              key={n}
              className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center"
            >
              {n}
            </span>
          ))}
          {t.bonusNumbers && t.bonusNumbers.length > 0 && (
            <>
              <span className="text-[10px] text-slate-500 font-bold">+</span>
              {t.bonusNumbers.map((b) => (
                <span
                  key={`b-${b}`}
                  className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center"
                >
                  {b}
                </span>
              ))}
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Price',
      cell: (t) => (
        <span className="font-bold text-slate-200">
          {formatCurrency(t.price, t.lottery?.currency || 'ETB')}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (t) => {
        const variants: Record<TicketStatus, 'success' | 'info' | 'default' | 'danger' | 'purple'> = {
          ACTIVE: 'info',
          WON: 'success',
          LOST: 'default',
          CANCELLED: 'danger',
          REFUNDED: 'purple',
        };
        return <Badge variant={variants[t.status] || 'default'}>{t.status}</Badge>;
      },
    },
    {
      header: 'Purchased At',
      cell: (t) => (
        <span className="text-slate-400">{formatDateTime(t.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-100">Ticket Registry</h2>
        <p className="text-xs text-slate-400">
          Search, audit, and track all player tickets issued in active and completed draws
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'WON', 'LOST', 'CANCELLED', 'REFUNDED'] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ),
          )}
        </div>
      </div>

      <Table<Ticket>
        columns={columns}
        data={ticketsResult?.data || []}
        isLoading={isLoading}
        pagination={ticketsResult?.pagination}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};
