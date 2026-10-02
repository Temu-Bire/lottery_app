import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Lottery } from '@lottery/shared';
import { Header } from './components/common/Header.js';
import { BottomNav } from './components/common/BottomNav.js';
import { HomePage } from './pages/HomePage.js';
import { LotteriesPage } from './pages/LotteriesPage.js';
import { LotteryDetailPage } from './pages/LotteryDetailPage.js';
import { BuyTicketPage } from './pages/BuyTicketPage.js';
import { TicketsPage } from './pages/TicketsPage.js';
import { WalletPage } from './pages/WalletPage.js';
import { WinnersPage } from './pages/WinnersPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { useAuthStore } from './stores/auth.store.js';
import { useTelegram } from './hooks/useTelegram.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [buyingLottery, setBuyingLottery] = useState<Lottery | null>(null);
  const [initialDepositOpen, setInitialDepositOpen] = useState(false);

  const { initData } = useTelegram();
  const { authenticateWithTelegram, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    // Attempt Telegram WebApp authentication if initData is present
    if (initData) {
      authenticateWithTelegram(initData);
    } else {
      // Check existing token in storage
      fetchCurrentUser();
    }
  }, [initData, authenticateWithTelegram, fetchCurrentUser]);

  const handleSelectLottery = (lottery: Lottery) => {
    setSelectedLottery(lottery);
    setBuyingLottery(null);
  };

  const handleBuyTicket = (lottery: Lottery) => {
    setBuyingLottery(lottery);
    setSelectedLottery(null);
  };

  const handleOpenDeposit = () => {
    setBuyingLottery(null);
    setSelectedLottery(null);
    setInitialDepositOpen(true);
    setCurrentTab('wallet');
  };

  const handleTabChange = (tab: string) => {
    setSelectedLottery(null);
    setBuyingLottery(null);
    setInitialDepositOpen(false);
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-lg mx-auto shadow-2xl relative">
      <Header onNavigateTab={handleTabChange} />

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Detail and Purchase Sub-views */}
        {buyingLottery ? (
          <BuyTicketPage
            lottery={buyingLottery}
            onBack={() => setBuyingLottery(null)}
            onViewTickets={() => {
              setBuyingLottery(null);
              setCurrentTab('tickets');
            }}
            onOpenDeposit={handleOpenDeposit}
          />
        ) : selectedLottery ? (
          <LotteryDetailPage
            lottery={selectedLottery}
            onBack={() => setSelectedLottery(null)}
            onBuyTicket={handleBuyTicket}
          />
        ) : (
          /* Primary Tabs */
          <>
            {currentTab === 'home' && (
              <HomePage
                onSelectLottery={handleSelectLottery}
                onBuyTicket={handleBuyTicket}
                onNavigateTab={handleTabChange}
              />
            )}
            {currentTab === 'lotteries' && (
              <LotteriesPage
                onSelectLottery={handleSelectLottery}
                onBuyTicket={handleBuyTicket}
              />
            )}
            {currentTab === 'tickets' && (
              <TicketsPage
                onBrowseLotteries={() => handleTabChange('lotteries')}
              />
            )}
            {currentTab === 'wallet' && (
              <WalletPage initialDepositOpen={initialDepositOpen} />
            )}
            {currentTab === 'winners' && <WinnersPage />}
            {currentTab === 'profile' && <ProfilePage />}
          </>
        )}
      </main>

      <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
