import { drawRepository, type WinnerCalculatedData } from './draw.repository.js';
import { generateSecureWinningNumbers } from '../../utils/cryptoRandom.js';
import { ApiError } from '../../utils/errors.js';
import { recordAuditLog } from '../../utils/audit.js';
import { buildPaginatedResult, type PaginationQuery } from '../../utils/pagination.js';
import { prisma } from '../../config/database.js';
import { type DrawStatus, type WinnerStatus, type PayoutStatus } from '@prisma/client';
import { type ClientContext } from '../auth/auth.service.js';
import { Decimal } from '@prisma/client/runtime/library';

export class DrawService {
  async executeDraw(drawId: string, operatorId: string, client: ClientContext) {
    const draw = await drawRepository.findById(drawId);
    if (!draw) {
      throw ApiError.notFound('Draw not found', 'DRAW_NOT_FOUND');
    }

    if (draw.status === 'COMPLETED') {
      throw ApiError.badRequest('This draw has already been completed', 'DRAW_ALREADY_COMPLETED');
    }

    if (draw.status === 'PROCESSING') {
      throw ApiError.badRequest('This draw is currently being processed', 'DRAW_PROCESSING');
    }

    const rules = draw.lottery.rules;
    if (!rules) {
      throw ApiError.internal('Lottery rules configuration is missing');
    }

    const prizes = draw.lottery.prizes;
    if (!prizes || prizes.length === 0) {
      throw ApiError.internal('Lottery prize structure is not configured');
    }

    // 1. Lock lottery status to DRAWING
    await prisma.lottery.update({
      where: { id: draw.lotteryId },
      data: { status: 'DRAWING' },
    });

    await recordAuditLog({
      userId: operatorId,
      actor: operatorId,
      action: 'DRAW_STARTED',
      resource: 'Draw',
      resourceId: drawId,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    // 2. Fetch all active tickets for this lottery
    const eligibleTickets = await prisma.ticket.findMany({
      where: {
        lotteryId: draw.lotteryId,
        status: 'ACTIVE',
      },
    });

    // 3. Generate cryptographically secure winning numbers with verifiable audit proof
    const randomResult = generateSecureWinningNumbers(
      rules.numberRangeMin,
      rules.numberRangeMax,
      rules.maxNumbers,
      rules.bonusNumbersCount,
      rules.bonusRangeMin,
      rules.bonusRangeMax,
    );

    // 4. Calculate winners
    const winners: WinnerCalculatedData[] = [];
    const losingTicketIds: string[] = [];

    // Sort prizes so higher value tiers (tier 1, tier 2, ...) evaluate first
    const sortedPrizes = [...prizes].sort((a, b) => a.tier - b.tier);

    for (const ticket of eligibleTickets) {
      const matchCount = ticket.selectedNumbers.filter((n) =>
        randomResult.numbers.includes(n),
      ).length;

      const matchedBonus =
        rules.bonusNumbersCount > 0
          ? ticket.bonusNumbers.some((b) => randomResult.bonusNumbers.includes(b))
          : false;

      // Find matching prize tier
      const matchingPrize = sortedPrizes.find(
        (p) =>
          p.matchCount === matchCount &&
          (!p.matchBonus || matchedBonus),
      );

      if (matchingPrize) {
        winners.push({
          ticketId: ticket.id,
          userId: ticket.userId,
          prizeId: matchingPrize.id,
          matchCount,
          matchedBonus,
          prizeAmount: new Decimal(matchingPrize.amount.toString()),
        });
      } else {
        losingTicketIds.push(ticket.id);
      }
    }

    // 5. Commit draw execution in transaction
    const completedDraw = await drawRepository.executeDrawTransaction({
      drawId: draw.id,
      lotteryId: draw.lotteryId,
      numbers: randomResult.numbers,
      bonusNumbers: randomResult.bonusNumbers,
      seed: randomResult.seed,
      randomnessProof: randomResult.randomnessProof,
      winners,
      losingTicketIds,
    });

    await recordAuditLog({
      userId: operatorId,
      actor: operatorId,
      action: 'DRAW_COMPLETED',
      resource: 'Draw',
      resourceId: drawId,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: {
        winningNumbers: randomResult.numbers,
        bonusNumbers: randomResult.bonusNumbers,
        seedHash: randomResult.seedHash,
        totalEligibleTickets: eligibleTickets.length,
        totalWinners: winners.length,
      },
    });

    return {
      drawId: completedDraw.id,
      drawNumber: completedDraw.drawNumber,
      status: completedDraw.status,
      executedAt: completedDraw.executedAt,
      winningNumbers: randomResult.numbers,
      bonusNumbers: randomResult.bonusNumbers,
      seedHash: randomResult.seedHash,
      randomnessProof: JSON.parse(randomResult.randomnessProof),
      totalTickets: eligibleTickets.length,
      totalWinners: winners.length,
      winners: completedDraw.winners,
    };
  }

  async listDraws(query: PaginationQuery & { lotteryId?: string; status?: DrawStatus }) {
    const { data, total } = await drawRepository.findAll(query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getDrawById(id: string) {
    const draw = await drawRepository.findById(id);
    if (!draw) {
      throw ApiError.notFound('Draw not found', 'DRAW_NOT_FOUND');
    }
    return draw;
  }

  async getDrawResults(id: string) {
    const draw = await this.getDrawById(id);
    if (draw.status !== 'COMPLETED') {
      throw ApiError.badRequest('Draw has not been completed yet', 'DRAW_NOT_COMPLETED');
    }

    return {
      drawId: draw.id,
      lotteryName: draw.lottery.name,
      drawNumber: draw.drawNumber,
      status: draw.status,
      scheduledAt: draw.scheduledAt,
      executedAt: draw.executedAt,
      winningNumbers: draw.winningNumbers,
      winnersCount: draw.winners.length,
      winners: draw.winners,
      randomnessProof: draw.randomnessProof ? JSON.parse(draw.randomnessProof) : null,
    };
  }

  async listWinners(
    query: PaginationQuery & {
      drawId?: string;
      userId?: string;
      status?: WinnerStatus;
      payoutStatus?: PayoutStatus;
    },
  ) {
    const { data, total } = await drawRepository.findWinners(query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getWinnerById(id: string) {
    const winner = await drawRepository.findWinnerById(id);
    if (!winner) {
      throw ApiError.notFound('Winner record not found', 'WINNER_NOT_FOUND');
    }
    return winner;
  }
}

export const drawService = new DrawService();
