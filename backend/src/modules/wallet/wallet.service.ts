import crypto from 'node:crypto';
import { walletRepository } from './wallet.repository.js';
import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/errors.js';
import { recordAuditLog } from '../../utils/audit.js';
import { buildPaginatedResult, type PaginationQuery } from '../../utils/pagination.js';
import { Decimal } from '@prisma/client/runtime/library';
import { type WalletOperation } from '@prisma/client';
import { type ClientContext } from '../auth/auth.service.js';

export class WalletService {
  async getWallet(userId: string) {
    const wallet = await walletRepository.findOrCreateWallet(userId);
    const audit = await this.verifyFinancialConsistency(userId);

    return {
      wallet: {
        id: wallet.id,
        balance: wallet.balance.toString(),
        lockedBalance: wallet.lockedBalance.toString(),
        currency: wallet.currency,
        updatedAt: wallet.updatedAt,
      },
      audit,
    };
  }

  async getTransactions(
    userId: string,
    query: PaginationQuery & { operation?: WalletOperation },
  ) {
    const wallet = await walletRepository.findOrCreateWallet(userId);
    const { data, total } = await walletRepository.getTransactions(wallet.id, query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async claimPrize(userId: string, winnerId: string, client: ClientContext) {
    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      include: {
        prize: true,
        draw: {
          include: {
            lottery: true,
          },
        },
      },
    });

    if (!winner) {
      throw ApiError.notFound('Winning record not found', 'WINNER_NOT_FOUND');
    }

    if (winner.userId !== userId) {
      throw ApiError.forbidden('Unauthorized access to prize', 'FORBIDDEN');
    }

    if (winner.status !== 'VERIFIED') {
      throw ApiError.badRequest('Prize is still pending verification', 'PRIZE_NOT_VERIFIED');
    }

    if (winner.payoutStatus === 'PAID') {
      throw ApiError.badRequest('Prize has already been claimed and paid', 'PRIZE_ALREADY_PAID');
    }

    const prizeReference = `PRZ-${winner.draw.drawNumber}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Credit wallet and update winner in transaction
    const result = await prisma.$transaction(async (tx) => {
      const { wallet, transaction } = await walletRepository.creditWalletTransaction({
        userId,
        amount: new Decimal(winner.prizeAmount.toString()),
        operation: 'PRIZE',
        referenceId: prizeReference,
        description: `Won ${winner.prize.name} in lottery ${winner.draw.lottery.name} (Draw #${winner.draw.drawNumber})`,
        metadata: {
          drawId: winner.drawId,
          ticketId: winner.ticketId,
          prizeId: winner.prizeId,
          prizeTier: winner.prize.tier,
        },
      });

      await tx.winner.update({
        where: { id: winnerId },
        data: {
          payoutStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      return { wallet, transaction };
    });

    await recordAuditLog({
      userId,
      actor: userId,
      action: 'SECURITY_EVENT',
      resource: 'Wallet',
      resourceId: result.wallet.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: {
        action: 'PRIZE_CLAIMED',
        prizeAmount: winner.prizeAmount.toString(),
        referenceId: prizeReference,
      },
    });

    return {
      success: true,
      amount: winner.prizeAmount.toString(),
      referenceId: prizeReference,
      newBalance: result.wallet.balance.toString(),
    };
  }

  /**
   * Verifies mathematical consistency of the wallet against all ledger transactions:
   * balance == sum(credits) - sum(debits)
   */
  async verifyFinancialConsistency(userId: string): Promise<{
    isConsistent: boolean;
    walletBalance: string;
    calculatedLedgerBalance: string;
    discrepancy: string;
  }> {
    const wallet = await walletRepository.getWalletByUserId(userId);
    if (!wallet) {
      return {
        isConsistent: true,
        walletBalance: '0',
        calculatedLedgerBalance: '0',
        discrepancy: '0',
      };
    }

    const transactions = await walletRepository.getAllTransactionsForVerification(wallet.id);

    let calculatedBalance = new Decimal(0);

    for (const tx of transactions) {
      if (
        tx.operation === 'DEPOSIT' ||
        tx.operation === 'PRIZE' ||
        tx.operation === 'REFUND'
      ) {
        calculatedBalance = calculatedBalance.plus(tx.amount);
      } else if (
        tx.operation === 'WITHDRAWAL' ||
        tx.operation === 'TICKET_PURCHASE'
      ) {
        calculatedBalance = calculatedBalance.minus(tx.amount);
      } else if (tx.operation === 'ADJUSTMENT') {
        if (tx.balanceAfter.greaterThan(tx.balanceBefore)) {
          calculatedBalance = calculatedBalance.plus(tx.amount);
        } else {
          calculatedBalance = calculatedBalance.minus(tx.amount);
        }
      }
    }

    // Include currently locked balance in consistency calculation
    const totalEffectiveBalance = wallet.balance.plus(wallet.lockedBalance);
    const discrepancy = totalEffectiveBalance.minus(calculatedBalance);
    const isConsistent = discrepancy.equals(0);

    return {
      isConsistent,
      walletBalance: wallet.balance.toString(),
      calculatedLedgerBalance: calculatedBalance.toString(),
      discrepancy: discrepancy.toString(),
    };
  }
}

export const walletService = new WalletService();
