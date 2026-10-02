import { ApiClient } from '../client.js';
import { User, UpdateMeRequest } from '../../types/auth.js';
import { Ticket } from '../../types/ticket.js';
import { WalletTransaction } from '../../types/wallet.js';
import { Winner } from '../../types/winner.js';
import {
  PaginationQuery,
  PaginatedResult,
} from '../../types/api.js';
import { UserAdminListQuery, UpdateUserStatusRequest } from '../../types/admin.js';

export const createUserApi = (client: ApiClient) => ({
  getMe: () => client.get<User>('/users/me'),

  updateMe: (data: UpdateMeRequest) => client.patch<User>('/users/me', data),

  getMyTickets: (query?: PaginationQuery): Promise<PaginatedResult<Ticket>> =>
    client.getPaginated<Ticket>('/users/me/tickets', query as Record<string, unknown>),

  getMyTransactions: (query?: PaginationQuery): Promise<PaginatedResult<WalletTransaction>> =>
    client.getPaginated<WalletTransaction>('/users/me/transactions', query as Record<string, unknown>),

  getMyWinners: (query?: PaginationQuery): Promise<PaginatedResult<Winner>> =>
    client.getPaginated<Winner>('/users/me/winners', query as Record<string, unknown>),

  // Admin User endpoints
  listUsers: (query?: UserAdminListQuery): Promise<PaginatedResult<User>> =>
    client.getPaginated<User>('/admin/users', query as Record<string, unknown>),

  getUserById: (id: string) => client.get<User>(`/admin/users/${id}`),

  updateUserStatus: (id: string, data: UpdateUserStatusRequest) =>
    client.patch<User>(`/admin/users/${id}/status`, data),
});

export type UserApi = ReturnType<typeof createUserApi>;
