import { userRepository } from './user.repository.js';
import { ApiError } from '../../utils/errors.js';
import { recordAuditLog } from '../../utils/audit.js';
import { buildPaginatedResult, type PaginationQuery, type PaginatedResult } from '../../utils/pagination.js';
import { type UserStatus, type Ticket, type WalletTransaction, type Winner } from '@prisma/client';

export class UserService {
  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found', 'USER_NOT_FOUND');
    }
    return user;
  }

  async updateMe(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found', 'USER_NOT_FOUND');
    }

    return userRepository.updateMe(userId, data);
  }

  async getMyTickets(userId: string, query: PaginationQuery): Promise<PaginatedResult<Ticket>> {
    const { data, total } = await userRepository.getUserTickets(userId, query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getMyTransactions(userId: string, query: PaginationQuery): Promise<PaginatedResult<WalletTransaction>> {
    const { data, total } = await userRepository.getUserTransactions(userId, query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getMyWinners(userId: string, query: PaginationQuery): Promise<PaginatedResult<Winner>> {
    const { data, total } = await userRepository.getUserWinners(userId, query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async listUsers(query: PaginationQuery & { status?: UserStatus; search?: string }) {
    const { data, total } = await userRepository.findUsers(query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getUserById(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return user;
  }

  async updateUserStatus(
    targetUserId: string,
    status: UserStatus,
    reason: string | undefined,
    adminId: string,
    client: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const updated = await userRepository.updateStatus(targetUserId, status);

    await recordAuditLog({
      userId: targetUserId,
      actor: adminId,
      action: status === 'SUSPENDED' || status === 'BLOCKED' ? 'USER_SUSPENDED' : 'SECURITY_EVENT',
      resource: 'User',
      resourceId: targetUserId,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { previousStatus: user.status, newStatus: status, reason },
    });

    return updated;
  }
}

export const userService = new UserService();
