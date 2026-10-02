import { PaginationQuery } from './api.js';

export type WithdrawalStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED';

export type DestinationType = 'BANK_TRANSFER' | 'CRYPTO' | 'TELEGRAM_WALLET';

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number | string;
  currency: string;
  destinationType: DestinationType | string;
  destinationDetails: Record<string, unknown>;
  status: WithdrawalStatus;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  transactionReference?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface CreateWithdrawalRequest {
  amount: number;
  currency?: string;
  destinationType: DestinationType;
  destinationDetails: Record<string, unknown>;
}

export interface ReviewWithdrawalRequest {
  note?: string;
}

export interface WithdrawalListQuery extends PaginationQuery {
  userId?: string;
  status?: WithdrawalStatus;
}
