import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlayCircle, Eye, ShieldCheck } from 'lucide-react';
import { Draw, DrawStatus, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { useAdminAuthStore } from '../stores/admin-auth.store.js';

export const DrawsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAdminAuthStore();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DrawStatus | 'ALL'>('ALL');

  // Confirmation dialog state
  const [executingDraw, setExecutingDraw] = useState<Draw | null>(null);

  // Results inspector modal state
  const [inspectingDraw, setInspectingDraw] = useState<Draw | null>(null);

  const { data: drawsResult, isLoading } = useQuery({
    queryKey: ['admin', 'draws', page, statusFilter],
    queryFn: () =>
      api.draw.list({
        page,
        limit: 15,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const executeMutation = useMutation({
    mutationFn: async (drawId: string) => {
      return api.draw.execute(drawId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'draws'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      setExecutingDraw(null);
      // Auto-open results for review
      if (data?.draw) {
        setInspectingDraw(data.draw);
      }
    },
  });

  const columns: Column<Draw>[] = [
    {
      header: 'Draw #',
      cell: (d) => (
        <span className="font-mono font-bold text-slate-100">
          Draw #{d.drawNumber}
        </span>
      ),
    },
    {
      header: 'Lottery Game',
      cell: (d) => (
        <span className="font-bold text-slate-200">
          {d.lottery?.name || 'Lottery Draw'}
        </span>
      ),
    },
    {
      header: 'Scheduled At',
      cell: (d) => (
        <span className="text-slate-300">{formatDateTime(d.scheduledAt)}</span>
      ),
    },
    {
      header: 'Executed At',
      cell: (d) => (
        <span className="text-slate-400">
          {d.executedAt ? formatDateTime(d.executedAt) : '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (d) => {
        const variants: Record<DrawStatus, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
          SCHEDULED: 'info',
          PROCESSING: 'warning',
          COMPLETED: 'success',
          FAILED: 'danger',
          CANCELLED: 'default',
        };
        return <Badge variant={variants[d.status] || 'default'}>{d.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (d) => {
        const canExecute = hasPermission('draw:execute');
        const isScheduled = d.status === 'SCHEDULED' || d.status === 'PROCESSING';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {isScheduled && canExecute && (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-400 border-amber-900/50 hover:bg-amber-950/30 text-xs py-1"
                leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                onClick={() => setExecutingDraw(d)}
              >
                Execute Draw
              </Button>
            )}

            {d.status === 'COMPLETED' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-300 hover:text-white text-xs py-1"
                leftIcon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => setInspectingDraw(d)}
              >
                View Proof
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-100">Draw Management</h2>
        <p className="text-xs text-slate-400">
          Monitor scheduled draws and execute provably fair lottery selection routines
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['ALL', 'SCHEDULED', 'COMPLETED', 'FAILED'] as const).map((st) => (
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
        ))}
      </div>

      {/* Table */}
      <Table<Draw>
        columns={columns}
        data={drawsResult?.data || []}
        isLoading={isLoading}
        pagination={drawsResult?.pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Explicit Dangerous Action Confirmation Dialog */}
      {executingDraw && (
        <ConfirmDialog
          isOpen={true}
          title="Execute Cryptographic Lottery Draw"
          message={`Are you sure you want to execute Draw #${executingDraw.drawNumber} for "${executingDraw.lottery?.name || 'Lottery'}"?`}
          warningNote="This action cannot be undone. Winning numbers will be generated via HMAC-DRBG, ticket winners will be computed immediately, and prizes will be committed to the immutable ledger."
          confirmLabel="Execute Draw Now"
          cancelLabel="Cancel"
          isDestructive={true}
          isLoading={executeMutation.isPending}
          onConfirm={() => executeMutation.mutate(executingDraw.id)}
          onCancel={() => setExecutingDraw(null)}
        />
      )}

      {/* Draw Result & Cryptographic Proof Inspector */}
      {inspectingDraw && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingDraw(null)}
          title={`Draw #${inspectingDraw.drawNumber} — Cryptographic Proof`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block">Drawn Winning Numbers</span>
              <div className="flex items-center gap-2 flex-wrap">
                {inspectingDraw.winningNumbers?.[0]?.numbers?.map((n) => (
                  <span
                    key={n}
                    className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-600/30"
                  >
                    {n}
                  </span>
                )) || <span className="text-slate-500 italic">No numbers available</span>}

                {inspectingDraw.winningNumbers?.[0]?.bonusNumbers?.map((n) => (
                  <span
                    key={`b-${n}`}
                    className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-md shadow-amber-500/30"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Provable Randomness Seed
              </span>
              <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 break-all border border-slate-800">
                {inspectingDraw.seed || 'Cryptographic seed committed'}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300">Randomness Proof (HMAC-SHA256)</span>
              <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 break-all border border-slate-800 max-h-32 overflow-y-auto">
                {inspectingDraw.randomnessProof || 'HMAC-DRBG verification proof recorded'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setInspectingDraw(null)}>
                Close Proof
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
