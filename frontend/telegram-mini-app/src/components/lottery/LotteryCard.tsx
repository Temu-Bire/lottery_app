import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Ticket as TicketIcon, ArrowRight } from 'lucide-react';
import { Lottery, formatCurrency, calculateTimeRemaining, LOTTERY_STATUS_CONFIG } from '@lottery/shared';
import { Card } from '../common/Card.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';

export interface LotteryCardProps {
  lottery: Lottery;
  onSelect: (lottery: Lottery) => void;
  onBuy?: (lottery: Lottery) => void;
  featured?: boolean;
}

export const LotteryCard: React.FC<LotteryCardProps> = ({
  lottery,
  onSelect,
  onBuy,
  featured = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(lottery.drawDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(lottery.drawDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [lottery.drawDate]);

  // Find max prize (jackpot)
  const jackpotPrize = lottery.prizes?.reduce((max, p) => {
    const amt = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
    return amt > max ? amt : max;
  }, 0) || 0;

  const statusConfig = LOTTERY_STATUS_CONFIG[lottery.status] || {
    label: lottery.status,
    color: '#94a3b8',
    bg: '#1e293b',
  };

  const isOpen = lottery.status === 'OPEN' && !timeLeft.isExpired;

  return (
    <Card
      variant={featured ? 'gradient' : 'default'}
      className="relative overflow-hidden group cursor-pointer transition-all duration-200 hover:border-slate-700"
      onClick={() => onSelect(lottery)}
    >
      {featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3 h-3 fill-current" />
          Featured Jackpot
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-100 text-base group-hover:text-blue-400 transition-colors">
            {lottery.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {lottery.description || 'Pick your lucky numbers and win'}
          </p>
        </div>
        <Badge
          className="ml-2 shrink-0"
          variant={isOpen ? 'success' : lottery.status === 'DRAWING' ? 'info' : 'default'}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Jackpot Amount */}
      <div className="my-3 py-3 px-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Top Prize
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
            {jackpotPrize > 0 ? formatCurrency(jackpotPrize, lottery.currency) : 'Jackpot Pool'}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-medium text-slate-400 block">Ticket Price</span>
          <span className="text-sm font-bold text-slate-200">
            {formatCurrency(lottery.ticketPrice, lottery.currency)}
          </span>
        </div>
      </div>

      {/* Countdown & Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{timeLeft.formatted}</span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && onBuy ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onBuy(lottery);
              }}
              leftIcon={<TicketIcon className="w-3.5 h-3.5" />}
              className="px-3 py-1.5 text-xs font-semibold"
            >
              Play Now
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(lottery);
              }}
              rightIcon={<ArrowRight className="w-3 h-3" />}
              className="px-2.5 py-1 text-xs"
            >
              Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
