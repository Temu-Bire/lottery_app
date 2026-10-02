import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Code } from 'lucide-react';
import { AuditLog, AuditAction, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Button } from '../components/common/Button.js';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);

  const { data: auditResult, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, actionFilter],
    queryFn: () =>
      api.admin.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter === 'ALL' ? undefined : actionFilter,
      }),
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Actor',
      cell: (log) => (
        <div>
          <span className="font-bold text-slate-100 block">{log.actor}</span>
          <span className="text-[10px] text-slate-500 font-mono">
            IP: {log.ipAddress || 'unknown'}
          </span>
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (log) => {
        const isAuth = log.action.includes('LOGIN') || log.action.includes('REGISTER');
        const isDangerous =
          log.action.includes('SUSPENDED') ||
          log.action.includes('CANCEL') ||
          log.action.includes('DELETE');

        return (
          <Badge
            variant={
              isDangerous ? 'danger' : isAuth ? 'info' : 'purple'
            }
          >
            {log.action}
          </Badge>
        );
      },
    },
    {
      header: 'Target Resource',
      cell: (log) => (
        <div>
          <span className="font-semibold text-slate-200 block">{log.resource}</span>
          {log.resourceId && (
            <span className="font-mono text-[10px] text-slate-400">
              ID: {log.resourceId.slice(0, 12)}...
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Timestamp',
      cell: (log) => (
        <span className="text-slate-400">{formatDateTime(log.createdAt)}</span>
      ),
    },
    {
      header: 'Details',
      className: 'text-right',
      cell: (log) => {
        if (!log.metadata || Object.keys(log.metadata).length === 0) {
          return <span className="text-slate-600 italic">None</span>;
        }

        return (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs py-1 text-slate-400 hover:text-white"
            leftIcon={<Code className="w-3.5 h-3.5" />}
            onClick={() => setInspectingLog(log)}
          >
            View Payload
          </Button>
        );
      },
    },
  ];

  const actionPresets: Array<AuditAction | 'ALL'> = [
    'ALL',
    'LOGIN',
    'LOGIN_FAILED',
    'LOTTERY_CREATED',
    'DRAW_COMPLETED',
    'USER_SUSPENDED',
    'WITHDRAWAL_APPROVED',
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Immutable Audit Trail
        </h2>
        <p className="text-xs text-slate-400">
          Append-only security log recording every administrative action, draw event, and financial movement
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {actionPresets.map((act) => (
          <button
            key={act}
            onClick={() => {
              setActionFilter(act);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              actionFilter === act
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table<AuditLog>
        columns={columns}
        data={auditResult?.data || []}
        isLoading={isLoading}
        pagination={auditResult?.pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Metadata Inspector Modal */}
      {inspectingLog && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingLog(null)}
          title={`Audit Event: ${inspectingLog.action}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div>
                <span className="text-slate-400">Actor:</span>{' '}
                <strong className="text-white">{inspectingLog.actor}</strong>
              </div>
              <div>
                <span className="text-slate-400">Resource:</span>{' '}
                <span className="text-slate-200 font-mono">
                  {inspectingLog.resource} (ID: {inspectingLog.resourceId || 'N/A'})
                </span>
              </div>
              <div>
                <span className="text-slate-400">IP & User Agent:</span>{' '}
                <span className="text-slate-400 font-mono">
                  {inspectingLog.ipAddress || 'unknown'} • {inspectingLog.userAgent || 'unknown'}
                </span>
              </div>
            </div>

            <span className="font-bold text-slate-300 block">Metadata Payload:</span>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto max-h-60">
              {JSON.stringify(inspectingLog.metadata, null, 2)}
            </pre>
          </div>
        </Modal>
      )}
    </div>
  );
};
