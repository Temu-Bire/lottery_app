import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Dices,
  Ticket,
  PlayCircle,
  Trophy,
  CreditCard,
  ArrowUpRight,
  BarChart3,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminAuthStore } from '../stores/admin-auth.store.js';
import { Badge } from '../components/common/Badge.js';

export interface AdminLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
}) => {
  const { user, logout, hasPermission } = useAdminAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, permission: 'user:read' as const },
    { id: 'lotteries', label: 'Lotteries', icon: Dices, permission: 'lottery:create' as const },
    { id: 'tickets', label: 'Tickets', icon: Ticket, permission: 'ticket:read' as const },
    { id: 'draws', label: 'Draws', icon: PlayCircle, permission: 'draw:execute' as const },
    { id: 'winners', label: 'Winners', icon: Trophy },
    { id: 'payments', label: 'Payments', icon: CreditCard, permission: 'payment:read' as const },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight, permission: 'withdrawal:read' as const },
    { id: 'reports', label: 'Reports', icon: BarChart3, permission: 'report:read' as const },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck, permission: 'audit:read' as const },
  ];

  const handleSelectNav = (id: string) => {
    onNavigate(id);
    setSidebarOpen(false);
  };

  const currentItem = navItems.find((n) => n.id === currentRoute);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                LOTTO<span className="text-blue-400">ADMIN</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Management Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              // Hide navigation links that user has no permission to view
              return null;
            }

            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectNav(item.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                {user?.email}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge size="sm" variant="info">
                  {user?.roles?.[0] || 'ADMIN'}
                </Badge>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-transparent hover:border-red-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Portal</span>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-slate-200">
                {currentItem?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 hidden sm:inline">
              Production API: <strong className="text-emerald-400">Connected</strong>
            </span>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
