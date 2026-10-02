import { ApiClient } from '../client.js';
import {
  Lottery,
  CreateLotteryRequest,
  UpdateLotteryRequest,
  LotteryListQuery,
} from '../../types/lottery.js';
import { PurchaseTicketsRequest, Ticket } from '../../types/ticket.js';
import { PaginatedResult } from '../../types/api.js';

export const createLotteryApi = (client: ApiClient) => ({
  list: (query?: LotteryListQuery): Promise<PaginatedResult<Lottery>> =>
    client.getPaginated<Lottery>('/lotteries', query as Record<string, unknown>, { requiresAuth: false }),

  getById: (id: string): Promise<Lottery> =>
    client.get<Lottery>(`/lotteries/${id}`, undefined, { requiresAuth: false }),

  purchaseTickets: (lotteryId: string, data: PurchaseTicketsRequest): Promise<{ tickets: Ticket[]; totalCost: number }> =>
    client.post<{ tickets: Ticket[]; totalCost: number }>(`/lotteries/${lotteryId}/tickets`, data),

  // Management endpoints
  create: (data: CreateLotteryRequest): Promise<Lottery> =>
    client.post<Lottery>('/lotteries', data),

  update: (id: string, data: UpdateLotteryRequest): Promise<Lottery> =>
    client.patch<Lottery>(`/lotteries/${id}`, data),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    client.delete<{ success: boolean; message: string }>(`/lotteries/${id}`),

  open: (id: string): Promise<Lottery> =>
    client.post<Lottery>(`/lotteries/${id}/open`),

  close: (id: string): Promise<Lottery> =>
    client.post<Lottery>(`/lotteries/${id}/close`),

  cancel: (id: string): Promise<Lottery> =>
    client.post<Lottery>(`/lotteries/${id}/cancel`),
});

export type LotteryApi = ReturnType<typeof createLotteryApi>;
