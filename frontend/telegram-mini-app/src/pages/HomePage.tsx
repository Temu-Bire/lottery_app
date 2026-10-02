import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Trophy, Ticket as TicketIcon, ArrowRight, Wallet, Flame } from 'lucide-react';
import { Lottery, formatCurrency } from '@lottery/shared';
import { api } from '../api/client.js';
import { LotteryCard } from '../components/lottery/LotteryCard.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { ErrorAlert } from '../components/common/ErrorAlert.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Card } from '../components/common/Card.js';

export interface HomePageProps {
  onSelectLottery: (lottery: Lottery) => void;
  onBuyTicket: (lottery: Lottery) => void;
  onNavigateTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectLottery,
  onBuyTicket,
  onNavigateTab,
}) => {

  const {
    data: lotteriesData,
    isLoading: isLotteriesLoading,
    error: lotteriesError,
    refetch: refetchLotteries,
  } = useQuery({
    queryKey: ['lotteries', 'home'],
    queryFn: () => api.lottery.list({ limit: 10, status: 'OPEN' }),
  });

  const { data: winnersData } = useQuery({
    queryKey: ['winners', 'recent'],
    queryFn: () => api.winner.list({ limit: 5 }),
  });

  const lotteries = lotteriesData?.data || [];
  const featuredLottery = lotteries[0];
  const otherLotteries = lotteries.slice(1);
  const winners = winnersData?.data || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-5 text-white shadow-xl shadow-indigo-950/30">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-[11px] font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            Official Fair Play Lottery
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Win Life-Changing Jackpots
          </h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-xs">
            Cryptographically verified draws, instant wallet payouts, and transparent odds.
          </p>

          <div className="flex items-center gap-3 mt-4 pt-1">
            <button
              onClick={() => onNavigateTab('lotteries')}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold shadow-md hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5"
            >
              Browse Games
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('tickets')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all"
            >
              My Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card
          variant="interactive"
          onClick={() => onNavigateTab('lotteries')}
          className="p-3 text-center flex flex-col items-center justify-center gap-1.5"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <TicketIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-200">Play Now</span>
        </Card>

        <Card
          variant="interactive"
          onClick={() => onNavigateTab('wallet')}
          className="p-3 text-center flex flex-col items-center justify-center gap-1.5"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-200">Deposit</span>
        </Card>

        <Card
          variant="interactive"
          onClick={() => onNavigateTab('winners')}
          className="p-3 text-center flex flex-col items-center justify-center gap-1.5"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-200">Winners</span>
        </Card>
      </div>

      {/* Featured Lottery Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            Featured Game
          </h3>
          <button
            onClick={() => onNavigateTab('lotteries')}
            className="text-xs text-blue-400 font-semibold hover:underline"
          >
            View All
          </button>
        </div>

        {isLotteriesLoading ? (
          <CardSkeleton />
        ) : lotteriesError ? (
          <ErrorAlert
            message="Failed to load lotteries"
            onRetry={() => refetchLotteries()}
          />
        ) : featuredLottery ? (
          <LotteryCard
            lottery={featuredLottery}
            featured={true}
            onSelect={onSelectLottery}
            onBuy={onBuyTicket}
          />
        ) : (
          <EmptyState
            title="No active lotteries"
            description="New lotteries will be opening soon. Please check back shortly!"
            actionText="Check Wallet"
            onAction={() => onNavigateTab('wallet')}
          />
        )}
      </div>

      {/* More Lotteries */}
      {otherLotteries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-100 px-1">
            More Active Lotteries
          </h3>
          <div className="space-y-3">
            {otherLotteries.map((lottery) => (
              <LotteryCard
                key={lottery.id}
                lottery={lottery}
                onSelect={onSelectLottery}
                onBuy={onBuyTicket}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Winners Ticker */}
      {winners.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Latest Winners
            </h3>
            <button
              onClick={() => onNavigateTab('winners')}
              className="text-xs text-blue-400 font-semibold hover:underline"
            >
              See All
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            {winners.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {w.prize?.name || `Tier ${w.prizeId}`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Match {w.matchCount} numbers
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-400">
                    +{formatCurrency(w.prizeAmount, 'ETB')}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase">
                    Paid Out
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
