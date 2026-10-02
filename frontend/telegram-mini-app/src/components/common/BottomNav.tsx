import React from 'react';
import { Home, Dices, Ticket, Wallet, Trophy, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useTelegram } from '../../hooks/useTelegram.js';

export interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { haptic } = useTelegram();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'lotteries', label: 'Lottery', icon: Dices },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'winners', label: 'Winners', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              haptic('selection');
              onTabChange(tab.id);
            }}
            className={clsx(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all',
              isActive
                ? 'text-blue-400 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <Icon className={clsx('w-5 h-5 mb-0.5', isActive && 'stroke-[2.5]')} />
            <span className="text-[10px] leading-tight tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
