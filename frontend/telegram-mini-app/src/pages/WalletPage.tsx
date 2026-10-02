import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  DollarSign,
  Send,
  Building,
} from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  WalletOperation,
  ApiError,
  DestinationType,
} from '@lottery/shared';
import { api } from '../api/client.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { ErrorAlert } from '../components/common/ErrorAlert.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useTelegram } from '../hooks/useTelegram.js';

export interface WalletPageProps {
  initialDepositOpen?: boolean;
}

export const WalletPage: React.FC<WalletPageProps> = ({ initialDepositOpen = false }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { haptic } = useTelegram();

  const [depositModalOpen, setDepositModalOpen] = useState(initialDepositOpen);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositError, setDepositError] = useState<string | null>(null);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [destinationType, setDestinationType] = useState<DestinationType>('TELEGRAM_WALLET');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Queries
  const {
    data: wallet,
    isLoading: isWalletLoading,
    error: walletError,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.wallet.getWallet(),
    enabled: isAuthenticated,
  });

  const currentBalance = typeof wallet?.balance === 'string'
    ? parseFloat(wallet.balance)
    : (wallet?.balance || 0);

  const {
    data: transactionsData,
    isLoading: isTxLoading,
  } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => api.wallet.getTransactions({ limit: 30 }),
    enabled: isAuthenticated,
  });

  // Deposit Mutation
  const depositMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid deposit amount');
      }
      return api.payment.create({
        amount,
        currency: wallet?.currency || 'ETB',
        provider: 'mock',
      });
    },
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setDepositModalOpen(false);
      setDepositError(null);
    },
    onError: (err: unknown) => {
      haptic('error');
      setDepositError(err instanceof ApiError ? err.message : 'Deposit initiation failed');
    },
  });

  // Withdrawal Mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < 10) {
        throw new Error('Minimum withdrawal is 10.00');
      }
      if (!accountNumber.trim()) {
        throw new Error('Destination account/address is required');
      }

      return api.withdrawal.create({
        amount,
        currency: wallet?.currency || 'ETB',
        destinationType,
        destinationDetails: {
          accountNumber: accountNumber.trim(),
        },
      });
    },
    onSuccess: () => {
      haptic('success');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setWithdrawModalOpen(false);
      setWithdrawError(null);
      setAccountNumber('');
    },
    onError: (err: unknown) => {
      haptic('error');
      setWithdrawError(err instanceof ApiError ? err.message : 'Withdrawal request failed');
    },
  });

  const transactions = transactionsData?.data || [];

  const getOperationBadge = (op: WalletOperation) => {
    switch (op) {
      case 'DEPOSIT':
        return { label: 'Deposit', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' };
      case 'PRIZE':
        return { label: 'Prize Payout', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' };
      case 'TICKET_PURCHASE':
        return { label: 'Ticket Buy', color: 'text-blue-400 bg-blue-950/40 border-blue-800/40' };
      case 'WITHDRAWAL':
        return { label: 'Withdrawal', color: 'text-purple-400 bg-purple-950/40 border-purple-800/40' };
      case 'REFUND':
        return { label: 'Refund', color: 'text-teal-400 bg-teal-950/40 border-teal-800/40' };
      default:
        return { label: op, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Wallet & Balance</h2>
        <p className="text-xs text-slate-400">
          Manage your balance, add funds, or request direct withdrawals
        </p>
      </div>

      {/* Balance Card */}
      {isWalletLoading ? (
        <CardSkeleton />
      ) : walletError ? (
        <ErrorAlert message="Failed to load wallet" onRetry={() => refetchWallet()} />
      ) : (
        <Card variant="gradient" className="p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-200/80 flex items-center gap-1.5 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-blue-300" />
              Available Balance
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
              {wallet?.currency || 'ETB'}
            </span>
          </div>

          <div className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(wallet?.balance ?? 0, wallet?.currency || 'ETB')}
          </div>

          {Number(wallet?.lockedBalance || 0) > 0 && (
            <div className="mt-2 text-xs text-amber-300/90 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatCurrency(wallet?.lockedBalance, wallet?.currency || 'ETB')} in review for withdrawal
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-2 border-t border-white/10">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                haptic('medium');
                setDepositModalOpen(true);
              }}
              leftIcon={<ArrowDownLeft className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Deposit
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                haptic('medium');
                setWithdrawModalOpen(true);
              }}
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold"
            >
              Withdraw
            </Button>
          </div>
        </Card>
      )}

      {/* Ledger Transaction History */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Transaction History</h3>

        {isTxLoading ? (
          <div className="space-y-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            {transactions.map((tx) => {
              const badge = getOperationBadge(tx.operation);
              const isCredit =
                tx.operation === 'DEPOSIT' ||
                tx.operation === 'PRIZE' ||
                tx.operation === 'REFUND';

              return (
                <div
                  key={tx.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {tx.referenceId.slice(0, 12)}...
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDateTime(tx.createdAt)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold ${
                        isCredit ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isCredit ? '+' : '-'}
                      {formatCurrency(tx.amount, wallet?.currency || 'ETB')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Bal: {formatCurrency(tx.balanceAfter, wallet?.currency || 'ETB')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-900/60 rounded-xl border border-slate-800">
            No wallet transactions yet. Deposits and ticket purchases will appear here.
          </p>
        )}
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Deposit Funds"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400">
            Instantly add funds to your player wallet to purchase lottery tickets.
          </p>

          <Input
            label="Amount (ETB)"
            type="number"
            min="1"
            max="100000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            leftIcon={<DollarSign className="w-4 h-4" />}
          />

          <div className="flex items-center gap-2">
            {['50', '100', '250', '500', '1000'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDepositAmount(preset)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
              >
                +{preset}
              </button>
            ))}
          </div>

          {depositError && <p className="text-xs text-red-400">{depositError}</p>}

          <Button
            className="w-full mt-2 font-bold"
            isLoading={depositMutation.isPending}
            onClick={() => depositMutation.mutate()}
          >
            Confirm Deposit ({depositAmount || 0} {wallet?.currency || 'ETB'})
          </Button>
        </div>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Withdraw Funds"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400">
            Request a secure payout to your Telegram wallet or bank account. Minimum withdrawal is 10.00 ETB.
          </p>

          <Input
            label="Withdrawal Amount (ETB)"
            type="number"
            min="10"
            max={currentBalance}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            leftIcon={<DollarSign className="w-4 h-4" />}
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Destination Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestinationType('TELEGRAM_WALLET')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  destinationType === 'TELEGRAM_WALLET'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Telegram Wallet
              </button>
              <button
                type="button"
                onClick={() => setDestinationType('BANK_TRANSFER')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  destinationType === 'BANK_TRANSFER'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Bank Transfer
              </button>
            </div>
          </div>

          <Input
            label={
              destinationType === 'TELEGRAM_WALLET'
                ? 'Telegram Wallet Address / Handle'
                : 'Bank Account Number / IBAN'
            }
            placeholder={
              destinationType === 'TELEGRAM_WALLET'
                ? '@username or UQ...'
                : 'Account number'
            }
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />

          {withdrawError && <p className="text-xs text-red-400">{withdrawError}</p>}

          <Button
            className="w-full mt-2 font-bold"
            isLoading={withdrawMutation.isPending}
            disabled={parseFloat(withdrawAmount) > currentBalance}
            onClick={() => withdrawMutation.mutate()}
          >
            Submit Withdrawal Request
          </Button>
        </div>
      </Modal>
    </div>
  );
};
