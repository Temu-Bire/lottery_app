import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';

export const ticketItemSchema = z.object({
  selectedNumbers: z.array(z.number().int()).min(1),
  bonusNumbers: z.array(z.number().int()).default([]),
});

export const purchaseTicketsSchema = z.object({
  tickets: z.array(ticketItemSchema).min(1, 'At least one ticket must be purchased').max(100, 'Maximum 100 tickets per purchase request'),
  idempotencyKey: z.string().trim().min(8).max(64).optional(),
});

export const ticketListQuerySchema = paginationQuerySchema.extend({
  lotteryId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'WON', 'LOST', 'CANCELLED', 'REFUNDED']).optional(),
  ticketNumber: z.string().trim().optional(),
});
