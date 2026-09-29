import { prisma } from '../../config/database.js';
import { type Ticket, type TicketStatus, type Prisma } from '@prisma/client';
import { getPaginationParams, type PaginationQuery } from '../../utils/pagination.js';
import { ApiError } from '../../utils/errors.js';
import { Decimal } from '@prisma/client/runtime/library';

export class TicketRepository {
  async purchaseTicketsTransaction(params: {
    userId: string;
    lotteryId: string;
    lotteryName: string;
    ticketPrice: Decimal;
    totalCost: Decimal;
    purchaseReference: string;
    ticketData: Array<{
      ticketNumber: string;
      selectedNumbers: number[];
      bonusNumbers: number[];
    }>;
  }): Promise<Ticket[]> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch user wallet and check balance
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        throw ApiError.badRequest('User wallet does not exist', 'WALLET_NOT_FOUND');
      }

      if (wallet.balance.lessThan(params.totalCost)) {
        throw ApiError.badRequest(
          `Insufficient wallet balance. Required: ${params.totalCost}, Available: ${wallet.balance}`,
          'INSUFFICIENT_FUNDS',
        );
      }

      // 2. Atomic check lottery maxTickets limit
      const lottery = await tx.lottery.findUnique({
        where: { id: params.lotteryId },
        select: { maxTickets: true, totalTicketsSold: true },
      });

      if (lottery?.maxTickets) {
        if (lottery.totalTicketsSold + params.ticketData.length > lottery.maxTickets) {
          throw ApiError.badRequest('Purchase exceeds maximum lottery ticket limit', 'TICKET_LIMIT_EXCEEDED');
        }
      }

      // 3. Deduct balance and record immutable ledger transaction
      const balanceBefore = wallet.balance;
      const balanceAfter = wallet.balance.minus(params.totalCost);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          referenceId: params.purchaseReference,
          operation: 'TICKET_PURCHASE',
          amount: params.totalCost,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: `Purchased ${params.ticketData.length} tickets for lottery ${params.lotteryName}`,
          metadata: {
            lotteryId: params.lotteryId,
            ticketCount: params.ticketData.length,
          },
        },
      });

      // 4. Update lottery total tickets sold
      await tx.lottery.update({
        where: { id: params.lotteryId },
        data: {
          totalTicketsSold: { increment: params.ticketData.length },
        },
      });

      // 5. Create tickets
      const createdTickets: Ticket[] = [];
      for (const t of params.ticketData) {
        const ticket = await tx.ticket.create({
          data: {
            ticketNumber: t.ticketNumber,
            lotteryId: params.lotteryId,
            userId: params.userId,
            purchaseReference: `${params.purchaseReference}-${t.ticketNumber}`,
            price: params.ticketPrice,
            selectedNumbers: t.selectedNumbers,
            bonusNumbers: t.bonusNumbers,
            status: 'ACTIVE',
          },
        });
        createdTickets.push(ticket);
      }

      return createdTickets;
    });
  }

  async findAll(
    query: PaginationQuery & {
      lotteryId?: string;
      userId?: string;
      status?: TicketStatus;
      ticketNumber?: string;
    },
  ) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.TicketWhereInput = {
      ...(query.lotteryId ? { lotteryId: query.lotteryId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.ticketNumber ? { ticketNumber: query.ticketNumber } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lottery: {
            select: {
              id: true,
              name: true,
              drawDate: true,
              status: true,
            },
          },
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
      prisma.ticket.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        lottery: {
          include: {
            rules: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        winners: {
          include: {
            prize: true,
          },
        },
      },
    });
  }
}

export const ticketRepository = new TicketRepository();
