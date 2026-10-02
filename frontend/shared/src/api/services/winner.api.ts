import { ApiClient } from '../client.js';
import { Winner, WinnerListQuery } from '../../types/winner.js';
import { PaginatedResult } from '../../types/api.js';

export const createWinnerApi = (client: ApiClient) => ({
  list: (query?: WinnerListQuery): Promise<PaginatedResult<Winner>> =>
    client.getPaginated<Winner>('/winners', query as Record<string, unknown>, { requiresAuth: false }),

  getById: (id: string): Promise<Winner> =>
    client.get<Winner>(`/winners/${id}`, undefined, { requiresAuth: false }),
});

export type WinnerApi = ReturnType<typeof createWinnerApi>;
