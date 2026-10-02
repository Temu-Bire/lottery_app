import { ApiClient } from '../client.js';
import { Draw, DrawListQuery } from '../../types/draw.js';
import { PaginatedResult } from '../../types/api.js';

export const createDrawApi = (client: ApiClient) => ({
  list: (query?: DrawListQuery): Promise<PaginatedResult<Draw>> =>
    client.getPaginated<Draw>('/draws', query as Record<string, unknown>, { requiresAuth: false }),

  getById: (id: string): Promise<Draw> =>
    client.get<Draw>(`/draws/${id}`, undefined, { requiresAuth: false }),

  getResults: (id: string): Promise<Draw> =>
    client.get<Draw>(`/draws/${id}/results`, undefined, { requiresAuth: false }),

  execute: (id: string): Promise<{ success: boolean; draw: Draw; winnersCount: number }> =>
    client.post<{ success: boolean; draw: Draw; winnersCount: number }>(`/draws/${id}/execute`),
});

export type DrawApi = ReturnType<typeof createDrawApi>;
