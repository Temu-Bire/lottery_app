import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Payment, PaymentStatus, formatCurrency, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';

export const PaymentsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  // Query payments
  const { data: paymentsResult, isLoading } = useQuery({
    queryKey: ['admin', 'payments', page, statusFilter],
    queryFn: () =>
      api.client.getPaginated<Payment>('/payments', {
        page,
        limit: 15,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const columns: Column<Payment>[] = [
    {
      header: 'External Reference',
      cell: (p) => (
        <span className="font-mono font-bold text-slate-100 block">
          {p.externalReference}
        </span>
      ),
    },
    {
      header: 'Provider',
      cell: (p) => (
        <span className="font-semibold text-slate-300 uppercase text-[11px]">
          {p.provider}
        </span>
      ),
    },
    {
      header: 'Amount',
      cell: (p) => (
        <span className="font-extrabold text-emerald-400">
          +{formatCurrency(p.amount, p.currency)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (p) => {
        const variants: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'purple'> = {
          COMPLETED: 'success',
          PENDING: 'warning',
          FAILED: 'danger',
          REFUNDED: 'purple',
        };
        return <Badge variant={variants[p.status] || 'default'}>{p.status}</Badge>;
      },
    },
    {
      header: 'Player / User ID',
      cell: (p) => (
        <span className="font-mono text-slate-400 text-[11px]">
          {p.userId}
        </span>
      ),
    },
    {
      header: 'Created At',
      cell: (p) => (
        <span className="text-slate-400">{formatDateTime(p.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-100">Payment Gateway Inbound</h2>
        <p className="text-xs text-slate-400">
          Monitor deposit transactions, external payment gateway webhooks, and provider references
        </p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'] as const).map(
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

      <Table<Payment>
        columns={columns}
        data={paymentsResult?.data || []}
        isLoading={isLoading}
        pagination={paymentsResult?.pagination}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};
