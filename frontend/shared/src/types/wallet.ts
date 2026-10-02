export type WalletOperation =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TICKET_PURCHASE'
  | 'PRIZE'
  | 'REFUND'
  | 'ADJUSTMENT';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WalletTransaction {
  id: string;
  walletId: string;
  referenceId: string;
  operation: WalletOperation;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  status: TransactionStatus;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number | string;
  lockedBalance: number | string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimPrizeResponse {
  winnerId: string;
  amount: number;
  transactionReference: string;
}

export interface WalletConsistencyResponse {
  isConsistent: boolean;
  currentBalance: number;
  computedBalance: number;
  variance: number;
}
