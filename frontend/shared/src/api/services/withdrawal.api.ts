import { ApiClient } from '../client.js';
import {
  Withdrawal,
  CreateWithdrawalRequest,
  ReviewWithdrawalRequest,
  WithdrawalListQuery,
} from '../../types/withdrawal.js';
import { PaginatedResult } from '../../types/api.js';

export const createWithdrawalApi = (client: ApiClient) => ({
  create: (data: CreateWithdrawalRequest): Promise<Withdrawal> =>
    client.post<Withdrawal>('/withdrawals', data),

  listUser: (query?: WithdrawalListQuery): Promise<PaginatedResult<Withdrawal>> =>
    client.getPaginated<Withdrawal>('/withdrawals', query as Record<string, unknown>),

  getById: (id: string): Promise<Withdrawal> =>
    client.get<Withdrawal>(`/withdrawals/${id}`),

  // Admin endpoints
  listAdmin: (query?: WithdrawalListQuery): Promise<PaginatedResult<Withdrawal>> =>
    client.getPaginated<Withdrawal>('/admin/withdrawals', query as Record<string, unknown>),

  approve: (id: string, data?: ReviewWithdrawalRequest): Promise<Withdrawal> =>
    client.post<Withdrawal>(`/admin/withdrawals/${id}/approve`, data || {}),

  reject: (id: string, data?: ReviewWithdrawalRequest): Promise<Withdrawal> =>
    client.post<Withdrawal>(`/admin/withdrawals/${id}/reject`, data || {}),
});

export type WithdrawalApi = ReturnType<typeof createWithdrawalApi>;
