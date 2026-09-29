import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';

export const createPaymentSchema = z.object({
  amount: z.number().positive('Deposit amount must be positive').min(1, 'Minimum deposit is 1.00').max(100000, 'Maximum deposit limit exceeded'),
  currency: z.string().trim().length(3).default('USD'),
  provider: z.string().trim().default('mock'),
  idempotencyKey: z.string().trim().min(8).max(64).optional(),
});

export const paymentListQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
});
