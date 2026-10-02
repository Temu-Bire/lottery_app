import React from 'react';
import { Trophy, Award } from 'lucide-react';
import { PrizeTier, formatCurrency } from '@lottery/shared';

export interface PrizeTableProps {
  prizes?: PrizeTier[];
  currency?: string;
}

export const PrizeTable: React.FC<PrizeTableProps> = ({
  prizes = [],
  currency = 'ETB',
}) => {
  if (!prizes || prizes.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic py-2">
        Prize breakdown will be announced prior to draw.
      </p>
    );
  }

  // Sort by tier ascending
  const sortedPrizes = [...prizes].sort((a, b) => a.tier - b.tier);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          Prize Distribution
        </span>
        <span className="text-[11px] text-slate-400">Match Rules</span>
      </div>
      <div className="divide-y divide-slate-800/80">
        {sortedPrizes.map((prize) => (
          <div
            key={prize.tier}
            className="px-4 py-3 flex items-center justify-between hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                {prize.tier === 1 ? (
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  prize.tier
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  {prize.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Match {prize.matchCount} numbers
                  {prize.matchBonus ? ' + Bonus' : ''}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-amber-400">
                {formatCurrency(prize.amount, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block uppercase">
                {prize.prizeType}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
