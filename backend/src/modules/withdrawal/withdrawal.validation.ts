import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';

export const createWithdrawalSchema = z.object({
  amount: z
    .number()
    .positive('Withdrawal amount must be positive')
    .min(10, 'Minimum withdrawal amount is 10.00')
    .max(50000, 'Maximum single withdrawal limit is 50,000.00'),
  currency: z.string().trim().length(3).default('USD'),
  destinationType: z.enum(['BANK_TRANSFER', 'CRYPTO', 'TELEGRAM_WALLET']),
  destinationDetails: z.record(z.string(), z.unknown()),
});

export const reviewWithdrawalSchema = z.object({
  note: z.string().trim().max(255).optional(),
});

export const withdrawalListQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED']).optional(),
});
