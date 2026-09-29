import { prisma } from '../../config/database.js';
import { type DrawStatus, type WinnerStatus, type PayoutStatus, type Prisma } from '@prisma/client';
import { getPaginationParams, type PaginationQuery } from '../../utils/pagination.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface WinnerCalculatedData {
  ticketId: string;
  userId: string;
  prizeId: string;
  matchCount: number;
  matchedBonus: boolean;
  prizeAmount: Decimal;
}

export class DrawRepository {
  async findById(id: string) {
    return prisma.draw.findUnique({
      where: { id },
      include: {
        lottery: {
          include: {
            rules: true,
            prizes: true,
          },
        },
        winningNumbers: true,
        winners: {
          include: {
            prize: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(query: PaginationQuery & { lotteryId?: string; status?: DrawStatus }) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.DrawWhereInput = {
      ...(query.lotteryId ? { lotteryId: query.lotteryId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.draw.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lottery: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          winningNumbers: true,
          _count: {
            select: {
              winners: true,
            },
          },
        },
      }),
      prisma.draw.count({ where }),
    ]);

    return { data, total };
  }

  async findOrCreateScheduledDraw(lotteryId: string, scheduledAt: Date) {
    const existing = await prisma.draw.findFirst({
      where: { lotteryId, status: 'SCHEDULED' },
    });

    if (existing) return existing;

    const count = await prisma.draw.count({ where: { lotteryId } });

    return prisma.draw.create({
      data: {
        lotteryId,
        drawNumber: count + 1,
        status: 'SCHEDULED',
        scheduledAt,
      },
    });
  }

  async executeDrawTransaction(params: {
    drawId: string;
    lotteryId: string;
    numbers: number[];
    bonusNumbers: number[];
    seed: string;
    randomnessProof: string;
    winners: WinnerCalculatedData[];
    losingTicketIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create winning numbers record
      await tx.winningNumber.create({
        data: {
          drawId: params.drawId,
          numbers: params.numbers,
          bonusNumbers: params.bonusNumbers,
        },
      });

      // 2. Mark winning tickets and create Winner records
      for (const w of params.winners) {
        await tx.ticket.update({
          where: { id: w.ticketId },
          data: { status: 'WON' },
        });

        await tx.winner.create({
          data: {
            drawId: params.drawId,
            ticketId: w.ticketId,
            userId: w.userId,
            prizeId: w.prizeId,
            matchCount: w.matchCount,
            matchedBonus: w.matchedBonus,
            prizeAmount: w.prizeAmount,
            status: 'VERIFIED',
            payoutStatus: 'UNPAID',
          },
        });
      }

      // 3. Mark losing tickets
      if (params.losingTicketIds.length > 0) {
        await tx.ticket.updateMany({
          where: { id: { in: params.losingTicketIds } },
          data: { status: 'LOST' },
        });
      }

      // 4. Update Draw record
      const completedDraw = await tx.draw.update({
        where: { id: params.drawId },
        data: {
          status: 'COMPLETED',
          executedAt: new Date(),
          seed: params.seed,
          randomnessProof: params.randomnessProof,
        },
        include: {
          winningNumbers: true,
          winners: {
            include: {
              prize: true,
            },
          },
        },
      });

      // 5. Update Lottery status
      await tx.lottery.update({
        where: { id: params.lotteryId },
        data: { status: 'COMPLETED' },
      });

      return completedDraw;
    });
  }

  async findWinners(
    query: PaginationQuery & {
      drawId?: string;
      userId?: string;
      status?: WinnerStatus;
      payoutStatus?: PayoutStatus;
    },
  ) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.WinnerWhereInput = {
      ...(query.drawId ? { drawId: query.drawId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.payoutStatus ? { payoutStatus: query.payoutStatus } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.winner.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          draw: {
            include: {
              lottery: { select: { id: true, name: true } },
            },
          },
          ticket: true,
          prize: true,
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
      prisma.winner.count({ where }),
    ]);

    return { data, total };
  }

  async findWinnerById(id: string) {
    return prisma.winner.findUnique({
      where: { id },
      include: {
        draw: {
          include: {
            lottery: true,
            winningNumbers: true,
          },
        },
        ticket: true,
        prize: true,
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
}

export const drawRepository = new DrawRepository();
