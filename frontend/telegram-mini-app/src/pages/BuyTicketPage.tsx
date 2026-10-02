import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, AlertTriangle, Plus, Trash2, Wallet, Ticket as TicketIcon } from 'lucide-react';
import { Lottery, TicketItem, formatCurrency, ApiError } from '@lottery/shared';
import { api } from '../api/client.js';
import { NumberPicker } from '../components/lottery/NumberPicker.js';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import { Modal } from '../components/common/Modal.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useTelegram } from '../hooks/useTelegram.js';

export interface BuyTicketPageProps {
  lottery: Lottery;
  onBack: () => void;
  onViewTickets: () => void;
  onOpenDeposit: () => void;
}

export const BuyTicketPage: React.FC<BuyTicketPageProps> = ({
  lottery,
  onBack,
  onViewTickets,
  onOpenDeposit,
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { haptic } = useTelegram();

  const rules = lottery.rules || {
    minNumbers: 6,
    maxNumbers: 6,
    numberRangeMin: 1,
    numberRangeMax: 49,
    bonusNumbersCount: 0,
    allowsDuplicates: false,
  };

  // State: array of tickets being purchased
  const [tickets, setTickets] = useState<TicketItem[]>([
    { selectedNumbers: [], bonusNumbers: [] },
  ]);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [purchaseSuccessModalOpen, setPurchaseSuccessModalOpen] = useState(false);
  const [purchasedTicketsResult, setPurchasedTicketsResult] = useState<any[]>([]);

  // Fetch wallet balance
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.wallet.getWallet(),
    enabled: isAuthenticated,
  });

  const ticketPrice = typeof lottery.ticketPrice === 'string'
    ? parseFloat(lottery.ticketPrice)
    : lottery.ticketPrice;

  const totalCost = tickets.length * ticketPrice;
  const currentBalance = typeof wallet?.balance === 'string'
    ? parseFloat(wallet.balance)
    : (wallet?.balance || 0);

  const hasSufficientBalance = currentBalance >= totalCost;

  // Validation: are all tickets completely filled?
  const allTicketsComplete = tickets.every(
    (t) =>
      t.selectedNumbers.length === rules.minNumbers &&
      (rules.bonusNumbersCount === 0 || (t.bonusNumbers?.length || 0) === rules.bonusNumbersCount),
  );

  const updateCurrentTicket = (selected: number[], bonus: number[]) => {
    setTickets((prev) => {
      const copy = [...prev];
      copy[activeTicketIndex] = {
        selectedNumbers: selected,
        bonusNumbers: bonus,
      };
      return copy;
    });
  };

  const addTicketLine = () => {
    if (tickets.length >= 10) return;
    haptic('medium');
    setTickets((prev) => [...prev, { selectedNumbers: [], bonusNumbers: [] }]);
    setActiveTicketIndex(tickets.length);
  };

  const removeTicketLine = (idx: number) => {
    if (tickets.length <= 1) return;
    haptic('light');
    setTickets((prev) => prev.filter((_, i) => i !== idx));
    setActiveTicketIndex((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  // Purchase Mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const idempotencyKey = `buy-${lottery.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return api.lottery.purchaseTickets(lottery.id, {
        tickets: tickets.map((t) => ({
          selectedNumbers: t.selectedNumbers,
          bonusNumbers: t.bonusNumbers || [],
        })),
        idempotencyKey,
      });
    },
    onSuccess: (data) => {
      haptic('success');
      // Invalidate relevant server queries
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['lotteries'] });
      setPurchasedTicketsResult(data.tickets || []);
      setPurchaseSuccessModalOpen(true);
    },
    onError: () => {
      haptic('error');
    },
  });

  const handlePurchase = () => {
    if (!isAuthenticated) return;
    if (!allTicketsComplete || !hasSufficientBalance) return;
    purchaseMutation.mutate();
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {lottery.name}
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Pick Numbers</h2>
          <p className="text-xs text-slate-400">
            {formatCurrency(lottery.ticketPrice, lottery.currency)} per ticket line
          </p>
        </div>
      </div>

      {/* Ticket Lines Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tickets.map((t, idx) => {
          const isComplete =
            t.selectedNumbers.length === rules.minNumbers &&
            (rules.bonusNumbersCount === 0 || (t.bonusNumbers?.length || 0) === rules.bonusNumbersCount);

          return (
            <div
              key={`line-${idx}`}
              onClick={() => setActiveTicketIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                activeTicketIndex === idx
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>Ticket #{idx + 1}</span>
              {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
              {tickets.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTicketLine(idx);
                  }}
                  className="hover:text-red-300 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {tickets.length < 10 && (
          <button
            type="button"
            onClick={addTicketLine}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line
          </button>
        )}
      </div>

      {/* Active Number Picker */}
      <Card className="p-4 bg-slate-900/90 border-slate-800">
        <NumberPicker
          rules={rules}
          selectedNumbers={tickets[activeTicketIndex].selectedNumbers}
          bonusNumbers={tickets[activeTicketIndex].bonusNumbers || []}
          onChange={updateCurrentTicket}
        />
      </Card>

      {/* Balance & Warning Bar */}
      <Card className="p-3 bg-slate-900 border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            Wallet Balance:
          </span>
          <span className="font-bold text-slate-200">
            {formatCurrency(currentBalance, lottery.currency)}
          </span>
        </div>

        {!hasSufficientBalance && isAuthenticated && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-900/40 text-amber-300 text-xs">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Insufficient funds for {tickets.length} ticket(s)</span>
            </div>
            <button
              onClick={onOpenDeposit}
              className="text-xs font-bold text-amber-400 underline shrink-0 hover:text-amber-300"
            >
              Deposit
            </button>
          </div>
        )}

        {purchaseMutation.error && (
          <p className="text-xs text-red-400">
            {purchaseMutation.error instanceof ApiError
              ? purchaseMutation.error.message
              : 'Failed to complete ticket purchase'}
          </p>
        )}
      </Card>

      {/* Pinned Bottom Purchase Bar */}
      <div className="fixed bottom-14 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-30 flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <span className="text-[10px] text-slate-400 block">
            {tickets.length} line(s) • Total
          </span>
          <span className="text-base font-extrabold text-white">
            {formatCurrency(totalCost, lottery.currency)}
          </span>
        </div>

        <Button
          size="md"
          isLoading={purchaseMutation.isPending}
          disabled={!allTicketsComplete || !hasSufficientBalance || !isAuthenticated}
          onClick={handlePurchase}
          leftIcon={<TicketIcon className="w-4 h-4" />}
          className="flex-1 max-w-xs font-bold"
        >
          {purchaseMutation.isPending
            ? 'Processing...'
            : !allTicketsComplete
            ? 'Pick All Numbers'
            : !hasSufficientBalance
            ? 'Deposit to Buy'
            : `Confirm & Buy (${formatCurrency(totalCost, lottery.currency)})`}
        </Button>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={purchaseSuccessModalOpen}
        onClose={() => {
          setPurchaseSuccessModalOpen(false);
          onViewTickets();
        }}
        title="Tickets Confirmed!"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-100">
              Successfully Purchased {purchasedTicketsResult.length} Ticket(s)!
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Your tickets are now registered in the official draw ledger. Good luck!
            </p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {purchasedTicketsResult.map((t, i) => (
              <div
                key={t.id || i}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
              >
                <span className="font-mono text-slate-400">#{t.ticketNumber}</span>
                <div className="flex items-center gap-1">
                  {t.selectedNumbers?.map((n: number) => (
                    <span
                      key={n}
                      className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
                setPurchaseSuccessModalOpen(false);
                onViewTickets();
              }}
            >
              View My Tickets
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
