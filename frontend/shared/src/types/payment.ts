import { PaginationQuery } from './api.js';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  userId: string;
  provider: string;
  externalReference: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  provider?: string;
  idempotencyKey?: string;
}

export interface PaymentListQuery extends PaginationQuery {
  userId?: string;
  status?: PaymentStatus;
}
