import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Play, Square, XCircle } from 'lucide-react';
import { Lottery, LotteryStatus, formatCurrency, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { CreateLotteryModal } from './CreateLotteryModal.js';
import { useAdminAuthStore } from '../stores/admin-auth.store.js';

export const LotteriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAdminAuthStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LotteryStatus | 'ALL'>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Dangerous action dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'open' | 'close' | 'cancel';
    lottery: Lottery;
  } | null>(null);

  const { data: lotteriesResult, isLoading } = useQuery({
    queryKey: ['admin', 'lotteries', page, search, statusFilter],
    queryFn: () =>
      api.lottery.list({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  // Action Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'open' | 'close' | 'cancel' }) => {
      if (type === 'open') return api.lottery.open(id);
      if (type === 'close') return api.lottery.close(id);
      return api.lottery.cancel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lotteries'] });
      setConfirmAction(null);
    },
  });

  const columns: Column<Lottery>[] = [
    {
      header: 'Lottery Game',
      cell: (l) => (
        <div>
          <span className="font-bold text-slate-100 block">{l.name}</span>
          <span className="text-[11px] text-slate-400 font-mono">/{l.slug}</span>
        </div>
      ),
    },
    {
      header: 'Ticket Price',
      cell: (l) => (
        <span className="font-bold text-slate-200">
          {formatCurrency(l.ticketPrice, l.currency)}
        </span>
      ),
    },
    {
      header: 'Tickets Sold',
      cell: (l) => (
        <span className="font-semibold text-slate-300">
          {l.totalTicketsSold.toLocaleString()}
          {l.maxTickets ? ` / ${l.maxTickets.toLocaleString()}` : ''}
        </span>
      ),
    },
    {
      header: 'Draw Scheduled',
      cell: (l) => (
        <span className="text-slate-300">{formatDateTime(l.drawDate)}</span>
      ),
    },
    {
      header: 'Status',
      cell: (l) => {
        const variants: Record<LotteryStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
          DRAFT: 'default',
          SCHEDULED: 'info',
          OPEN: 'success',
          CLOSED: 'warning',
          DRAWING: 'info',
          COMPLETED: 'success',
          CANCELLED: 'danger',
        };
        return <Badge variant={variants[l.status] || 'default'}>{l.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (l) => {
        const canUpdate = hasPermission('lottery:update');
        const canDelete = hasPermission('lottery:delete');

        return (
          <div className="flex items-center justify-end gap-1.5">
            {(l.status === 'DRAFT' || l.status === 'SCHEDULED') && canUpdate && (
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/30 text-xs py-1"
                leftIcon={<Play className="w-3 h-3" />}
                onClick={() => setConfirmAction({ type: 'open', lottery: l })}
              >
                Open
              </Button>
            )}

            {l.status === 'OPEN' && canUpdate && (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-400 border-amber-900/40 hover:bg-amber-950/30 text-xs py-1"
                leftIcon={<Square className="w-3 h-3" />}
                onClick={() => setConfirmAction({ type: 'close', lottery: l })}
              >
                Close
              </Button>
            )}

            {l.status !== 'COMPLETED' && l.status !== 'CANCELLED' && canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-400 border-red-900/40 hover:bg-red-950/30 text-xs py-1"
                leftIcon={<XCircle className="w-3 h-3" />}
                onClick={() => setConfirmAction({ type: 'cancel', lottery: l })}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-100">Lottery Management</h2>
          <p className="text-xs text-slate-400">
            Create game rules, publish scheduled lotteries, and control lifecycle states
          </p>
        </div>

        {hasPermission('lottery:create') && (
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Lottery
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by game name or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'OPEN', 'SCHEDULED', 'CLOSED', 'COMPLETED', 'CANCELLED'] as const).map(
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

      {/* Lotteries Table */}
      <Table<Lottery>
        columns={columns}
        data={lotteriesResult?.data || []}
        isLoading={isLoading}
        pagination={lotteriesResult?.pagination}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Create Lottery Modal */}
      <CreateLotteryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Dangerous Action Confirmation Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          title={
            confirmAction.type === 'cancel'
              ? 'Cancel Lottery Game'
              : confirmAction.type === 'close'
              ? 'Close Ticket Sales'
              : 'Open Ticket Sales'
          }
          message={`Are you sure you want to ${confirmAction.type} "${confirmAction.lottery.name}"?`}
          warningNote={
            confirmAction.type === 'cancel'
              ? 'Cancelling this lottery will permanently stop sales and may trigger ticket refund processing.'
              : confirmAction.type === 'close'
              ? 'Closing ticket sales will prevent players from purchasing any further tickets.'
              : 'Opening sales will make tickets immediately available for purchase to players.'
          }
          confirmLabel={
            confirmAction.type === 'cancel'
              ? 'Cancel Game'
              : confirmAction.type === 'close'
              ? 'Close Sales'
              : 'Open Sales'
          }
          isDestructive={confirmAction.type === 'cancel'}
          isLoading={actionMutation.isPending}
          onConfirm={() =>
            actionMutation.mutate({
              id: confirmAction.lottery.id,
              type: confirmAction.type,
            })
          }
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};
