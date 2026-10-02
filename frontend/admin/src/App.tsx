import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdminAuthStore } from './stores/admin-auth.store.js';
import { AdminLayout } from './layouts/AdminLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { LotteriesPage } from './pages/LotteriesPage.js';
import { DrawsPage } from './pages/DrawsPage.js';
import { TicketsPage } from './pages/TicketsPage.js';
import { WinnersPage } from './pages/WinnersPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { WithdrawalsPage } from './pages/WithdrawalsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
});

export const AdminAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAdminAuthStore();
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AdminLayout currentRoute={currentRoute} onNavigate={setCurrentRoute}>
      {currentRoute === 'dashboard' && <OverviewPage onNavigate={setCurrentRoute} />}
      {currentRoute === 'users' && <UsersPage />}
      {currentRoute === 'lotteries' && <LotteriesPage />}
      {currentRoute === 'draws' && <DrawsPage />}
      {currentRoute === 'tickets' && <TicketsPage />}
      {currentRoute === 'winners' && <WinnersPage />}
      {currentRoute === 'payments' && <PaymentsPage />}
      {currentRoute === 'withdrawals' && <WithdrawalsPage />}
      {currentRoute === 'reports' && <ReportsPage />}
      {currentRoute === 'audit' && <AuditLogsPage />}
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAppContent />
    </QueryClientProvider>
  );
};

export default App;
