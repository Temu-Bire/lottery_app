import { ArrowLeft, Clock, Ticket as TicketIcon, Info } from 'lucide-react';
import { Lottery, formatCurrency, formatDateTime, calculateTimeRemaining, LOTTERY_STATUS_CONFIG } from '@lottery/shared';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { PrizeTable } from '../components/lottery/PrizeTable.js';

export interface LotteryDetailPageProps {
  lottery: Lottery;
  onBack: () => void;
  onBuyTicket: (lottery: Lottery) => void;
}

export const LotteryDetailPage: React.FC<LotteryDetailPageProps> = ({
  lottery,
  onBack,
  onBuyTicket,
}) => {
  const timeLeft = calculateTimeRemaining(lottery.drawDate);
  const isOpen = lottery.status === 'OPEN' && !timeLeft.isExpired;

  const statusConfig = LOTTERY_STATUS_CONFIG[lottery.status] || {
    label: lottery.status,
    color: '#94a3b8',
    bg: '#1e293b',
  };

  const rules = lottery.rules;

  return (
    <div className="space-y-5 pb-28">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </button>

      {/* Hero Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={isOpen ? 'success' : 'default'}>
            {statusConfig.label}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft.formatted}</span>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-slate-100">{lottery.name}</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          {lottery.description || 'Pick your numbers or use Quick Pick to automatically select a random set.'}
        </p>
      </div>

      {/* Key Lottery Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3 bg-slate-900 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Ticket Price
          </span>
          <span className="text-base font-extrabold text-slate-100">
            {formatCurrency(lottery.ticketPrice, lottery.currency)}
          </span>
        </Card>

        <Card className="p-3 bg-slate-900 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Tickets Sold
          </span>
          <span className="text-base font-extrabold text-slate-100">
            {lottery.totalTicketsSold.toLocaleString()}
            {lottery.maxTickets ? ` / ${lottery.maxTickets.toLocaleString()}` : ''}
          </span>
        </Card>

        <Card className="p-3 bg-slate-900 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Sales Close
          </span>
          <span className="text-xs font-bold text-slate-200">
            {formatDateTime(lottery.salesEnd)}
          </span>
        </Card>

        <Card className="p-3 bg-slate-900 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Official Draw
          </span>
          <span className="text-xs font-bold text-slate-200">
            {formatDateTime(lottery.drawDate)}
          </span>
        </Card>
      </div>

      {/* Prize Breakdown */}
      <div>
        <h3 className="text-sm font-bold text-slate-200 mb-2">Prize Structure</h3>
        <PrizeTable prizes={lottery.prizes} currency={lottery.currency} />
      </div>

      {/* Rules Breakdown */}
      {rules && (
        <Card className="p-4 bg-slate-900/70 border-slate-800 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Game Rules
          </h3>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>
              Choose <strong className="text-white">{rules.minNumbers}</strong> numbers between{' '}
              <strong className="text-white">{rules.numberRangeMin}</strong> and{' '}
              <strong className="text-white">{rules.numberRangeMax}</strong>.
            </li>
            {rules.bonusNumbersCount > 0 && (
              <li>
                Includes <strong className="text-amber-400">{rules.bonusNumbersCount}</strong> bonus number(s) from{' '}
                <strong className="text-amber-400">{rules.bonusRangeMin || 1}-{rules.bonusRangeMax || 10}</strong>.
              </li>
            )}
            <li>
              Winning numbers are drawn using cryptographically secure HMAC-DRBG seed with verification proofs.
            </li>
          </ul>
        </Card>
      )}

      {/* Floating Bottom Bar with Action */}
      <div className="fixed bottom-14 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-30 flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <span className="text-[10px] text-slate-400 block">Total per ticket</span>
          <span className="text-base font-extrabold text-white">
            {formatCurrency(lottery.ticketPrice, lottery.currency)}
          </span>
        </div>
        <Button
          size="md"
          disabled={!isOpen}
          onClick={() => onBuyTicket(lottery)}
          leftIcon={<TicketIcon className="w-4 h-4" />}
          className="flex-1 max-w-xs font-bold"
        >
          {isOpen ? 'Buy Ticket' : 'Sales Closed'}
        </Button>
      </div>
    </div>
  );
};
