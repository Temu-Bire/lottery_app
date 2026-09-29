import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';

export const lotteryRuleSchema = z.object({
  minNumbers: z.number().int().min(1).default(6),
  maxNumbers: z.number().int().min(1).default(6),
  numberRangeMin: z.number().int().min(1).default(1),
  numberRangeMax: z.number().int().min(1).default(49),
  bonusNumbersCount: z.number().int().min(0).default(0),
  bonusRangeMin: z.number().int().optional(),
  bonusRangeMax: z.number().int().optional(),
  allowsDuplicates: z.boolean().default(false),
  termsAndConditions: z.string().optional(),
});

export const prizeTierSchema = z.object({
  tier: z.number().int().min(1),
  name: z.string().min(1),
  matchCount: z.number().int().min(1),
  matchBonus: z.boolean().default(false),
  prizeType: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
  amount: z.number().positive('Prize amount must be positive'),
});

export const createLotterySchema = z.object({
  name: z.string().trim().min(3).max(100),
  slug: z.string().trim().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(1000).optional(),
  ticketPrice: z.number().positive('Ticket price must be positive'),
  currency: z.string().trim().length(3).default('USD'),
  maxTickets: z.number().int().positive().optional(),
  salesStart: z.coerce.date(),
  salesEnd: z.coerce.date(),
  drawDate: z.coerce.date(),
  rules: lotteryRuleSchema,
  prizes: z.array(prizeTierSchema).min(1, 'At least one prize tier is required'),
}).refine((data) => data.salesStart < data.salesEnd, {
  message: 'salesEnd must be after salesStart',
  path: ['salesEnd'],
}).refine((data) => data.salesEnd <= data.drawDate, {
  message: 'drawDate must be at or after salesEnd',
  path: ['drawDate'],
});

export const updateLotterySchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  ticketPrice: z.number().positive().optional(),
  maxTickets: z.number().int().positive().optional(),
  salesStart: z.coerce.date().optional(),
  salesEnd: z.coerce.date().optional(),
  drawDate: z.coerce.date().optional(),
});

export const lotteryListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'DRAWING', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().trim().optional(),
});
