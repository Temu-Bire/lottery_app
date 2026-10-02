import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Award, Gift } from 'lucide-react';
import { formatCurrency, maskEmail } from '@lottery/shared';
import { api } from '../api/client.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { ErrorAlert } from '../components/common/ErrorAlert.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const WinnersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { haptic } = useTelegram();

  const [activeTab, setActiveTab] = useState<'ALL' | 'MINE'>('ALL');

  // Query All Public Winners
  const {
    data: allWinnersData,
    isLoading: isAllLoading,
    error: allError,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['winners', 'public'],
    queryFn: () => api.winner.list({ limit: 50 }),
  });

  // Query User's Personal Wins
  const {
    data: myWinnersData,
    isLoading: isMineLoading,
    error: mineError,
    refetch: refetchMine,
  } = useQuery({
    queryKey: ['winners', 'mine'],
    queryFn: () => api.user.getMyWinners({ limit: 50 }),
    enabled: isAuthenticated,
  });

  // Claim Prize Mutation
  const claimPrizeMutation = useMutation({
    mutationFn: async (winnerId: string) => {
      return api.wallet.claimPrize(winnerId);
    },
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['winners'] });
    },
    onError: () => {
      haptic('error');
    },
  });

  const publicWinners = allWinnersData?.data || [];
  const myWinners = myWinnersData?.data || [];

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Hall of Winners
        </h2>
        <p className="text-xs text-slate-400">
          Transparent public payout ledger and your personal prize claims
        </p>
      </div>

      {/* Toggle Tabs */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Winners
        </button>
        <button
          onClick={() => setActiveTab('MINE')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'MINE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Wins ({myWinners.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'ALL' ? (
        isAllLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : allError ? (
          <ErrorAlert message="Failed to load winners" onRetry={() => refetchAll()} />
        ) : publicWinners.length > 0 ? (
          <div className="space-y-2.5">
            {publicWinners.map((winner) => (
              <Card
                key={winner.id}
                className="p-3.5 bg-slate-900/90 border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">
                      {winner.prize?.name || `Tier ${winner.matchCount} Match`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Winner: {winner.user?.email ? maskEmail(winner.user.email) : 'Player'} • Match {winner.matchCount}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-400 block">
                    +{formatCurrency(winner.prizeAmount, 'ETB')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {winner.payoutStatus}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Trophy className="w-10 h-10" />}
            title="No winners recorded yet"
            description="Winners from the upcoming draws will be listed here automatically."
          />
        )
      ) : (
        /* My Wins Tab */
        !isAuthenticated ? (
          <EmptyState
            icon={<Trophy className="w-10 h-10" />}
            title="Sign in to view your prizes"
            description="Log in to check if your tickets have hit winning combinations."
          />
        ) : isMineLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
          </div>
        ) : mineError ? (
          <ErrorAlert message="Failed to load your winnings" onRetry={() => refetchMine()} />
        ) : myWinners.length > 0 ? (
          <div className="space-y-3">
            {myWinners.map((win) => {
              const isUnpaid = win.payoutStatus === 'UNPAID';

              return (
                <Card
                  key={win.id}
                  variant="gradient"
                  className="p-4 border-amber-900/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        Prize Won!
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">
                        {win.prize?.name || 'Lottery Win'}
                      </h4>
                    </div>
                    <Badge variant={isUnpaid ? 'warning' : 'success'}>
                      {win.payoutStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-slate-800">
                    <span className="text-xs text-slate-300">Prize Amount:</span>
                    <span className="text-base font-extrabold text-amber-400">
                      {formatCurrency(win.prizeAmount, 'ETB')}
                    </span>
                  </div>

                  {isUnpaid && (
                    <Button
                      size="sm"
                      className="w-full font-bold"
                      isLoading={claimPrizeMutation.isPending}
                      onClick={() => claimPrizeMutation.mutate(win.id)}
                      leftIcon={<Gift className="w-3.5 h-3.5" />}
                    >
                      Claim to Wallet
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Trophy className="w-10 h-10" />}
            title="No winning tickets yet"
            description="Keep playing! Next jackpot could be yours."
          />
        )
      )}
    </div>
  );
};
