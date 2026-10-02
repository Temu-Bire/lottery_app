import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserX, UserCheck } from 'lucide-react';
import { User, UserStatus, formatDateTime } from '@lottery/shared';
import { api } from '../api/client.js';
import { Table, Column } from '../components/common/Table.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { useAdminAuthStore } from '../stores/admin-auth.store.js';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAdminAuthStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');

  // Confirmation dialog state
  const [selectedUserForAction, setSelectedUserForAction] = useState<{
    user: User;
    targetStatus: UserStatus;
  } | null>(null);

  const { data: usersResult, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, statusFilter],
    queryFn: () =>
      api.user.listUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      return api.user.updateUserStatus(userId, {
        status,
        reason: `Administrative status change to ${status}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUserForAction(null);
    },
  });

  const columns: Column<User>[] = [
    {
      header: 'User Identity',
      cell: (user) => (
        <div>
          <span className="font-bold text-slate-100 block">{user.email}</span>
          <span className="text-[11px] text-slate-400">
            {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'No name provided'}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (user) => {
        const variants: Record<UserStatus, 'success' | 'warning' | 'danger' | 'default'> = {
          ACTIVE: 'success',
          SUSPENDED: 'warning',
          BLOCKED: 'danger',
          PENDING_VERIFICATION: 'default',
        };
        return <Badge variant={variants[user.status] || 'default'}>{user.status}</Badge>;
      },
    },
    {
      header: 'Role',
      cell: (user) => (
        <span className="font-semibold text-slate-300">
          {user.roles?.[0] || 'USER'}
        </span>
      ),
    },
    {
      header: 'Registered',
      cell: (user) => (
        <span className="text-slate-400">{formatDateTime(user.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (user) => {
        if (!hasPermission('user:suspend')) return null;

        const isSuspended = user.status === 'SUSPENDED' || user.status === 'BLOCKED';

        return (
          <div className="flex items-center justify-end gap-2">
            {isSuspended ? (
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/30 text-xs py-1"
                onClick={() =>
                  setSelectedUserForAction({ user, targetStatus: 'ACTIVE' })
                }
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              >
                Reactivate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-400 border-amber-900/50 hover:bg-amber-950/30 text-xs py-1"
                onClick={() =>
                  setSelectedUserForAction({ user, targetStatus: 'SUSPENDED' })
                }
                leftIcon={<UserX className="w-3.5 h-3.5" />}
              >
                Suspend
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
        <h2 className="text-xl font-black text-slate-100">User Management</h2>
        <p className="text-xs text-slate-400">
          Inspect registered players, filter by status, and manage account access
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'SUSPENDED', 'BLOCKED'] as const).map((st) => (
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
      </div>

      {/* Users Table */}
      <Table<User>
        columns={columns}
        data={usersResult?.data || []}
        isLoading={isLoading}
        pagination={usersResult?.pagination}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Confirm User Status Dialog */}
      {selectedUserForAction && (
        <ConfirmDialog
          isOpen={true}
          title={
            selectedUserForAction.targetStatus === 'SUSPENDED'
              ? 'Suspend User Account'
              : 'Reactivate User Account'
          }
          message={`Are you sure you want to change the status of ${selectedUserForAction.user.email} to ${selectedUserForAction.targetStatus}?`}
          warningNote={
            selectedUserForAction.targetStatus === 'SUSPENDED'
              ? 'The user will be immediately prevented from logging in or purchasing lottery tickets.'
              : 'The user will regain full access to purchase tickets and deposit funds.'
          }
          confirmLabel={
            selectedUserForAction.targetStatus === 'SUSPENDED'
              ? 'Suspend User'
              : 'Reactivate User'
          }
          isDestructive={selectedUserForAction.targetStatus === 'SUSPENDED'}
          isLoading={updateStatusMutation.isPending}
          onConfirm={() =>
            updateStatusMutation.mutate({
              userId: selectedUserForAction.user.id,
              status: selectedUserForAction.targetStatus,
            })
          }
          onCancel={() => setSelectedUserForAction(null)}
        />
      )}
    </div>
  );
};
