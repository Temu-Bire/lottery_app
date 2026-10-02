import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Dices } from 'lucide-react';
import { Lottery, LotteryStatus } from '@lottery/shared';
import { api } from '../api/client.js';
import { LotteryCard } from '../components/lottery/LotteryCard.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { ErrorAlert } from '../components/common/ErrorAlert.js';
import { EmptyState } from '../components/common/EmptyState.js';

export interface LotteriesPageProps {
  onSelectLottery: (lottery: Lottery) => void;
  onBuyTicket: (lottery: Lottery) => void;
}

export const LotteriesPage: React.FC<LotteriesPageProps> = ({
  onSelectLottery,
  onBuyTicket,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LotteryStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const {
    data: lotteriesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lotteries', 'list', selectedStatus, search],
    queryFn: () =>
      api.lottery.list({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search.trim() || undefined,
        limit: 50,
      }),
  });

  const filterTabs: Array<{ id: LotteryStatus | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Games' },
    { id: 'OPEN', label: 'Active' },
    { id: 'SCHEDULED', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  const lotteries = lotteriesData?.data || [];

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Lottery Draws</h2>
          <p className="text-xs text-slate-400">
            Pick a lottery to view prize tables or select your numbers
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lottery by name..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Content */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorAlert message="Failed to load lotteries" onRetry={() => refetch()} />
      ) : lotteries.length > 0 ? (
        <div className="space-y-3">
          {lotteries.map((lottery) => (
            <LotteryCard
              key={lottery.id}
              lottery={lottery}
              onSelect={onSelectLottery}
              onBuy={onBuyTicket}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Dices className="w-10 h-10" />}
          title="No lotteries found"
          description="There are no lotteries matching your selected criteria."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedStatus('ALL');
            setSearch('');
          }}
        />
      )}
    </div>
  );
};
