import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award } from 'lucide-react';
import { Winner, formatCurrency, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';

export const WinnersPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data: winnersResult, isLoading } = useQuery({
    queryKey: ['admin', 'winners', page],
    queryFn: () =>
      api.winner.list({
        page,
        limit: 15,
      }),
  });

  const columns: Column<Winner>[] = [
    {
      header: 'Prize Tier',
      cell: (w) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-100 block">
              {w.prize?.name || `Tier ${w.prizeId}`}
            </span>
            <span className="text-[11px] text-slate-400">Match {w.matchCount} numbers</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Prize Amount',
      cell: (w) => (
        <span className="font-extrabold text-amber-400">
          +{formatCurrency(w.prizeAmount, 'ETB')}
        </span>
      ),
    },
    {
      header: 'Winner Identity',
      cell: (w) => (
        <div>
          <span className="font-mono text-slate-300 block">
            {w.user?.email || w.userId.slice(0, 10) + '...'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Ticket: {w.ticketId?.slice(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      header: 'Verification',
      cell: (w) => (
        <Badge variant={w.status === 'VERIFIED' ? 'success' : 'warning'}>
          {w.status}
        </Badge>
      ),
    },
    {
      header: 'Payout Status',
      cell: (w) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
          PAID: 'success',
          UNPAID: 'warning',
          PROCESSING: 'info',
          FAILED: 'danger',
        };
        return (
          <Badge variant={variants[w.payoutStatus] || 'default'}>
            {w.payoutStatus}
          </Badge>
        );
      },
    },
    {
      header: 'Awarded At',
      cell: (w) => (
        <span className="text-slate-400">{formatDateTime(w.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-100">Winner Ledger</h2>
        <p className="text-xs text-slate-400">
          Review verified prize recipients and payout processing statuses
        </p>
      </div>

      <Table<Winner>
        columns={columns}
        data={winnersResult?.data || []}
        isLoading={isLoading}
        pagination={winnersResult?.pagination}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};
