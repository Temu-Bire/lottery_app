import { withdrawalRepository } from './withdrawal.repository.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import { ApiError } from '../../utils/errors.js';
import { recordAuditLog } from '../../utils/audit.js';
import { buildPaginatedResult, type PaginationQuery } from '../../utils/pagination.js';
import { Decimal } from '@prisma/client/runtime/library';
import { type WithdrawalStatus } from '@prisma/client';
import { type ClientContext } from '../auth/auth.service.js';
import { SystemRoles, type SystemRole } from '../role/role.types.js';

export class WithdrawalService {
  async requestWithdrawal(
    userId: string,
    data: {
      amount: number;
      currency: string;
      destinationType: string;
      destinationDetails: Record<string, unknown>;
    },
    client: ClientContext,
  ) {
    const wallet = await walletRepository.getWalletByUserId(userId);
    if (!wallet) {
      throw ApiError.badRequest('User wallet not found', 'WALLET_NOT_FOUND');
    }

    const decimalAmount = new Decimal(data.amount.toFixed(2));
    if (wallet.balance.lessThan(decimalAmount)) {
      throw ApiError.badRequest(
        `Insufficient available funds. Required: ${decimalAmount}, Available: ${wallet.balance}`,
        'INSUFFICIENT_FUNDS',
      );
    }

    const withdrawal = await withdrawalRepository.createWithdrawalRequest({
      userId,
      amount: decimalAmount,
      currency: data.currency,
      destinationType: data.destinationType,
      destinationDetails: data.destinationDetails,
    });

    await recordAuditLog({
      userId,
      actor: userId,
      action: 'WITHDRAWAL_CREATED',
      resource: 'Withdrawal',
      resourceId: withdrawal.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: {
        amount: data.amount,
        destinationType: data.destinationType,
      },
    });

    return withdrawal;
  }

  async listUserWithdrawals(
    userId: string,
    query: PaginationQuery & { status?: WithdrawalStatus },
  ) {
    const { data, total } = await withdrawalRepository.findAll({
      ...query,
      userId,
    });
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getWithdrawalById(id: string, user: { userId: string; roles: SystemRole[] }) {
    const withdrawal = await withdrawalRepository.findById(id);
    if (!withdrawal) {
      throw ApiError.notFound('Withdrawal not found', 'WITHDRAWAL_NOT_FOUND');
    }

    const isAdmin =
      user.roles.includes(SystemRoles.SUPER_ADMIN) ||
      user.roles.includes(SystemRoles.ADMIN) ||
      user.roles.includes(SystemRoles.FINANCE_OPERATOR);

    if (!isAdmin && withdrawal.userId !== user.userId) {
      throw ApiError.forbidden('Access denied to withdrawal', 'FORBIDDEN');
    }

    return withdrawal;
  }

  async listAdminWithdrawals(
    query: PaginationQuery & { userId?: string; status?: WithdrawalStatus },
  ) {
    const { data, total } = await withdrawalRepository.findAll(query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async approveWithdrawal(
    id: string,
    adminId: string,
    note: string | undefined,
    client: ClientContext,
  ) {
    const withdrawal = await withdrawalRepository.approveWithdrawal(id, adminId, note);

    await recordAuditLog({
      userId: withdrawal.userId,
      actor: adminId,
      action: 'WITHDRAWAL_APPROVED',
      resource: 'Withdrawal',
      resourceId: withdrawal.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { note, amount: withdrawal.amount.toString() },
    });

    return withdrawal;
  }

  async rejectWithdrawal(
    id: string,
    adminId: string,
    note: string | undefined,
    client: ClientContext,
  ) {
    const withdrawal = await withdrawalRepository.rejectWithdrawal(id, adminId, note);

    await recordAuditLog({
      userId: withdrawal.userId,
      actor: adminId,
      action: 'WITHDRAWAL_REJECTED',
      resource: 'Withdrawal',
      resourceId: withdrawal.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { note, amount: withdrawal.amount.toString() },
    });

    return withdrawal;
  }
}

export const withdrawalService = new WithdrawalService();
