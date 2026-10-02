import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Bell, Sparkles } from 'lucide-react';
import { formatCurrency } from '@lottery/shared';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/auth.store.js';

export interface HeaderProps {
  onNavigateTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab }) => {
  const { isAuthenticated } = useAuthStore();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.wallet.getWallet(),
    enabled: isAuthenticated,
    staleTime: 10000,
  });

  const { data: unreadNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await api.notification.list({ limit: 10 });
      return res.data.filter((n) => !n.isRead).length;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => onNavigateTab('home')}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white leading-none">
            LOTTO<span className="text-blue-400">WIN</span>
          </h1>
          <span className="text-[10px] text-slate-400 font-medium">Telegram Mini App</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {isAuthenticated && (
          <button
            onClick={() => onNavigateTab('wallet')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all text-xs font-semibold text-emerald-400"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatCurrency(wallet?.balance ?? 0, wallet?.currency || 'ETB')}</span>
          </button>
        )}

        <button
          onClick={() => onNavigateTab('profile')}
          className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          aria-label="Notifications & Profile"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications !== undefined && unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
          )}
        </button>
      </div>
    </header>
  );
};
