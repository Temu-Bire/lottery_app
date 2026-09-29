import { prisma } from '../../config/database.js';
import { type Wallet, type WalletTransaction, type WalletOperation, type Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getPaginationParams, type PaginationQuery } from '../../utils/pagination.js';
import { ApiError } from '../../utils/errors.js';

export class WalletRepository {
  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  }

  async findOrCreateWallet(userId: string, currency: string = 'USD'): Promise<Wallet> {
    const existing = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (existing) return existing;

    return prisma.wallet.create({
      data: {
        userId,
        currency,
        balance: 0.0,
        lockedBalance: 0.0,
      },
    });
  }

  async creditWalletTransaction(params: {
    userId: string;
    amount: Decimal;
    operation: WalletOperation;
    referenceId: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    return prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: params.userId,
            balance: 0.0,
            lockedBalance: 0.0,
          },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = wallet.balance.plus(params.amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          referenceId: params.referenceId,
          operation: params.operation,
          amount: params.amount,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: params.description,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async debitWalletTransaction(params: {
    userId: string;
    amount: Decimal;
    operation: WalletOperation;
    referenceId: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        throw ApiError.badRequest('Wallet not found', 'WALLET_NOT_FOUND');
      }

      if (wallet.balance.lessThan(params.amount)) {
        throw ApiError.badRequest('Insufficient wallet funds', 'INSUFFICIENT_FUNDS');
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = wallet.balance.minus(params.amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          referenceId: params.referenceId,
          operation: params.operation,
          amount: params.amount,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: params.description,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async holdFunds(userId: string, amount: Decimal, _referenceId: string): Promise<Wallet> {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw ApiError.badRequest('Wallet not found', 'WALLET_NOT_FOUND');
      }

      if (wallet.balance.lessThan(amount)) {
        throw ApiError.badRequest('Insufficient available balance for withdrawal hold', 'INSUFFICIENT_FUNDS');
      }

      return tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance.minus(amount),
          lockedBalance: wallet.lockedBalance.plus(amount),
        },
      });
    });
  }

  async releaseHeldFunds(userId: string, amount: Decimal): Promise<Wallet> {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw ApiError.badRequest('Wallet not found', 'WALLET_NOT_FOUND');
      }

      return tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance.plus(amount),
          lockedBalance: wallet.lockedBalance.minus(amount),
        },
      });
    });
  }

  async finalizeHeldFunds(params: {
    userId: string;
    amount: Decimal;
    referenceId: string;
    description: string;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        throw ApiError.badRequest('Wallet not found', 'WALLET_NOT_FOUND');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          lockedBalance: wallet.lockedBalance.minus(params.amount),
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          referenceId: params.referenceId,
          operation: 'WITHDRAWAL',
          amount: params.amount,
          balanceBefore: wallet.balance.plus(params.amount),
          balanceAfter: wallet.balance,
          status: 'COMPLETED',
          description: params.description,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async getTransactions(
    walletId: string,
    query: PaginationQuery & { operation?: WalletOperation },
  ) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.WalletTransactionWhereInput = {
      walletId,
      ...(query.operation ? { operation: query.operation } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return { data, total };
  }

  async getAllTransactionsForVerification(walletId: string): Promise<WalletTransaction[]> {
    return prisma.walletTransaction.findMany({
      where: { walletId, status: 'COMPLETED' },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const walletRepository = new WalletRepository();
