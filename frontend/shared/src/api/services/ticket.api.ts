import { ApiClient } from '../client.js';
import { Ticket, TicketListQuery } from '../../types/ticket.js';
import { PaginatedResult } from '../../types/api.js';

export const createTicketApi = (client: ApiClient) => ({
  list: (query?: TicketListQuery): Promise<PaginatedResult<Ticket>> =>
    client.getPaginated<Ticket>('/tickets', query as Record<string, unknown>),

  getById: (id: string): Promise<Ticket> =>
    client.get<Ticket>(`/tickets/${id}`),
});

export type TicketApi = ReturnType<typeof createTicketApi>;
