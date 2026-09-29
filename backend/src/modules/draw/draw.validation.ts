import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';

export const drawListQuerySchema = paginationQuerySchema.extend({
  lotteryId: z.string().uuid().optional(),
  status: z.enum(['SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
});

export const winnerListQuerySchema = paginationQuerySchema.extend({
  drawId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED']).optional(),
  payoutStatus: z.enum(['UNPAID', 'PROCESSING', 'PAID', 'FAILED']).optional(),
});
