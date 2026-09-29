import crypto from 'node:crypto';
import { prisma } from '../../config/database.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import { type Withdrawal, type WithdrawalStatus, type Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getPaginationParams, type PaginationQuery } from '../../utils/pagination.js';
import { ApiError } from '../../utils/errors.js';

export class WithdrawalRepository {
  async createWithdrawalRequest(params: {
    userId: string;
    amount: Decimal;
    currency: string;
    destinationType: string;
    destinationDetails: Record<string, unknown>;
  }): Promise<Withdrawal> {
    const transactionRef = `WTH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      // 1. Place hold on user funds
      await walletRepository.holdFunds(params.userId, params.amount, transactionRef);

      // 2. Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: params.userId,
          amount: params.amount,
          currency: params.currency,
          destinationType: params.destinationType,
          destinationDetails: params.destinationDetails as Prisma.InputJsonValue,
          status: 'PENDING',
          transactionReference: transactionRef,
        },
      });

      return withdrawal;
    });
  }

  async findAll(
    query: PaginationQuery & { userId?: string; status?: WithdrawalStatus },
  ) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.WithdrawalWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Withdrawal | null> {
    return prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async approveWithdrawal(
    id: string,
    reviewerId: string,
    note?: string,
  ): Promise<Withdrawal> {
    return prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id },
      });

      if (!withdrawal) {
        throw ApiError.notFound('Withdrawal not found', 'WITHDRAWAL_NOT_FOUND');
      }

      if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
        throw ApiError.badRequest(
          `Cannot approve withdrawal in ${withdrawal.status} status`,
          'INVALID_STATUS',
        );
      }

      // Finalize held funds: deduct locked balance and create WITHDRAWAL ledger transaction
      await walletRepository.finalizeHeldFunds({
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        referenceId: withdrawal.transactionReference || withdrawal.id,
        description: `Approved withdrawal to ${withdrawal.destinationType}`,
      });

      return tx.withdrawal.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          reviewedBy: reviewerId,
          reviewNote: note,
        },
      });
    });
  }

  async rejectWithdrawal(
    id: string,
    reviewerId: string,
    note?: string,
  ): Promise<Withdrawal> {
    return prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id },
      });

      if (!withdrawal) {
        throw ApiError.notFound('Withdrawal not found', 'WITHDRAWAL_NOT_FOUND');
      }

      if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'PROCESSING') {
        throw ApiError.badRequest(
          `Cannot reject withdrawal in ${withdrawal.status} status`,
          'INVALID_STATUS',
        );
      }

      // Release locked funds back to available balance
      await walletRepository.releaseHeldFunds(withdrawal.userId, withdrawal.amount);

      return tx.withdrawal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedBy: reviewerId,
          reviewNote: note,
        },
      });
    });
  }
}

export const withdrawalRepository = new WithdrawalRepository();
