import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination.js';

export const updateMeSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 expected)')
    .optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING_VERIFICATION']),
  reason: z.string().trim().min(3).max(255).optional(),
});

export const userListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING_VERIFICATION']).optional(),
  search: z.string().trim().optional(),
});
