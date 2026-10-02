import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Send,
  LogOut,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { user: tgUser, close } = useTelegram();

  // Notifications query
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notification.list({ limit: 10 }),
    enabled: isAuthenticated,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notification.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Player Profile</h2>
        <p className="text-xs text-slate-400">
          Account details, security, and linked Telegram session
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="p-4 bg-slate-900 border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-100 truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'Anonymous Player'}
            </h3>
            <span className="text-xs text-slate-400 truncate block">
              {user?.email}
            </span>
          </div>
          <Badge variant={user?.status === 'ACTIVE' ? 'success' : 'default'}>
            {user?.status || 'GUEST'}
          </Badge>
        </div>

        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Email Verification</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Telegram Link</span>
            <span className="font-semibold text-blue-400 flex items-center gap-1 mt-0.5">
              <Send className="w-3 h-3" />
              {tgUser?.username ? `@${tgUser.username}` : 'Connected'}
            </span>
          </div>
        </div>
      </Card>

      {/* Notifications Center */}
      <Card className="p-4 bg-slate-900 border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-blue-400" />
            Notifications ({unreadCount} unread)
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-[11px] text-blue-400 hover:underline font-semibold"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-xl text-xs border ${
                  n.isRead
                    ? 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                    : 'bg-blue-950/20 border-blue-900/40 text-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-0.5">
                  <span className="font-bold text-slate-100">{n.title}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            No notification messages at this time.
          </p>
        )}
      </Card>

      {/* Security & Provable Fairness */}
      <Card className="p-4 bg-slate-900 border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          Provable Fairness & Security
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Every draw uses cryptographic seed commitments and HMAC-SHA256 randomness verification. You can audit every ticket and draw proof on the official ledger.
        </p>
      </Card>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {isAuthenticated && (
          <Button
            variant="outline"
            size="md"
            className="w-full text-red-400 border-red-900/50 hover:bg-red-950/30 text-xs font-bold"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            onClick={() => logout()}
          >
            Sign Out
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-slate-500 text-xs"
          onClick={() => close()}
        >
          Close Mini App
        </Button>
      </div>
    </div>
  );
};
