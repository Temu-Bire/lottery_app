import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { Withdrawal, WithdrawalStatus, formatCurrency, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { useAdminAuthStore } from '../stores/admin-auth.store.js';

export const WithdrawalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAdminAuthStore();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'ALL'>('ALL');

  // Review Modal state
  const [reviewAction, setReviewAction] = useState<{
    type: 'approve' | 'reject';
    withdrawal: Withdrawal;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data: withdrawalsResult, isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals', page, statusFilter],
    queryFn: () =>
      api.withdrawal.listAdmin({
        page,
        limit: 15,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, type, note }: { id: string; type: 'approve' | 'reject'; note?: string }) => {
      if (type === 'approve') {
        return api.withdrawal.approve(id, { note });
      }
      return api.withdrawal.reject(id, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      setReviewAction(null);
      setReviewNote('');
    },
  });

  const columns: Column<Withdrawal>[] = [
    {
      header: 'Player',
      cell: (w) => (
        <div>
          <span className="font-semibold text-slate-100 block">
            {w.user?.email || w.userId.slice(0, 10) + '...'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {w.user?.firstName ? `${w.user.firstName} ${w.user.lastName || ''}` : 'Player'}
          </span>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (w) => (
        <span className="font-extrabold text-slate-100">
          {formatCurrency(w.amount, w.currency)}
        </span>
      ),
    },
    {
      header: 'Destination',
      cell: (w) => (
        <div>
          <span className="font-bold text-xs text-slate-300 block">
            {w.destinationType}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {String(w.destinationDetails?.accountNumber || w.destinationDetails?.walletAddress || 'Details provided')}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (w) => {
        const variants: Record<WithdrawalStatus, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
          PENDING: 'warning',
          PROCESSING: 'info',
          COMPLETED: 'success',
          REJECTED: 'danger',
          FAILED: 'danger',
          CANCELLED: 'default',
        };
        return <Badge variant={variants[w.status] || 'default'}>{w.status}</Badge>;
      },
    },
    {
      header: 'Requested At',
      cell: (w) => (
        <span className="text-slate-400">{formatDateTime(w.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (w) => {
        if (!hasPermission('withdrawal:approve')) return null;

        if (w.status === 'PENDING') {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/30 text-xs py-1"
                leftIcon={<Check className="w-3.5 h-3.5" />}
                onClick={() => setReviewAction({ type: 'approve', withdrawal: w })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-400 border-red-900/50 hover:bg-red-950/30 text-xs py-1"
                leftIcon={<X className="w-3.5 h-3.5" />}
                onClick={() => setReviewAction({ type: 'reject', withdrawal: w })}
              >
                Reject
              </Button>
            </div>
          );
        }

        return (
          <span className="text-[11px] text-slate-500">
            {w.reviewNote || 'Reviewed'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-100">Withdrawal Operations</h2>
        <p className="text-xs text-slate-400">
          Review, approve, or reject player fund withdrawals with audit notes
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'] as const).map(
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

      <Table<Withdrawal>
        columns={columns}
        data={withdrawalsResult?.data || []}
        isLoading={isLoading}
        pagination={withdrawalsResult?.pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Review Confirmation Modal with Note */}
      {reviewAction && (
        <Modal
          isOpen={true}
          onClose={() => setReviewAction(null)}
          title={
            reviewAction.type === 'approve'
              ? 'Approve Funds Withdrawal'
              : 'Reject Funds Withdrawal'
          }
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Player:</span>
                <span className="font-semibold text-slate-200">
                  {reviewAction.withdrawal.user?.email || reviewAction.withdrawal.userId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payout Amount:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {formatCurrency(reviewAction.withdrawal.amount, reviewAction.withdrawal.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="text-slate-200">
                  {reviewAction.withdrawal.destinationType}
                </span>
              </div>
            </div>

            <Input
              label={
                reviewAction.type === 'approve'
                  ? 'Approval Note / Reference (Optional)'
                  : 'Reason for Rejection (Required)'
              }
              placeholder={
                reviewAction.type === 'approve'
                  ? 'Bank wire ref # or batch id'
                  : 'Account details mismatch / security hold'
              }
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              required={reviewAction.type === 'reject'}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewAction(null)}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction.type === 'approve' ? 'success' : 'danger'}
                size="sm"
                isLoading={reviewMutation.isPending}
                disabled={reviewAction.type === 'reject' && !reviewNote.trim()}
                onClick={() =>
                  reviewMutation.mutate({
                    id: reviewAction.withdrawal.id,
                    type: reviewAction.type,
                    note: reviewNote.trim() || undefined,
                  })
                }
              >
                {reviewAction.type === 'approve' ? 'Approve & Release' : 'Reject & Unlock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
