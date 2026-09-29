import crypto from 'node:crypto';
import { ticketRepository } from './ticket.repository.js';
import { lotteryRepository } from '../lottery/lottery.repository.js';
import { ApiError } from '../../utils/errors.js';
import { recordAuditLog } from '../../utils/audit.js';
import { buildPaginatedResult, type PaginationQuery } from '../../utils/pagination.js';
import { Decimal } from '@prisma/client/runtime/library';
import { type TicketStatus } from '@prisma/client';
import { type ClientContext } from '../auth/auth.service.js';
import { SystemRoles, type SystemRole } from '../role/role.types.js';

export class TicketService {
  async purchaseTickets(
    lotteryId: string,
    userId: string,
    ticketItems: Array<{ selectedNumbers: number[]; bonusNumbers: number[] }>,
    idempotencyKey: string | undefined,
    client: ClientContext,
  ) {
    const lottery = await lotteryRepository.findById(lotteryId);
    if (!lottery) {
      throw ApiError.notFound('Lottery not found', 'LOTTERY_NOT_FOUND');
    }

    if (lottery.status !== 'OPEN') {
      throw ApiError.badRequest('Lottery is not currently open for ticket purchases', 'LOTTERY_NOT_OPEN');
    }

    const now = new Date();
    if (now < lottery.salesStart) {
      throw ApiError.badRequest('Ticket sales have not started yet', 'SALES_NOT_STARTED');
    }
    if (now > lottery.salesEnd) {
      throw ApiError.badRequest('Ticket sales window has closed for this draw', 'SALES_CLOSED');
    }

    const rules = lottery.rules;
    if (!rules) {
      throw ApiError.internal('Lottery rules configuration is missing');
    }

    // Validate numbers against lottery rules
    for (let i = 0; i < ticketItems.length; i++) {
      const item = ticketItems[i]!;

      if (item.selectedNumbers.length < rules.minNumbers || item.selectedNumbers.length > rules.maxNumbers) {
        throw ApiError.badRequest(
          `Ticket #${i + 1}: must select between ${rules.minNumbers} and ${rules.maxNumbers} numbers`,
          'INVALID_NUMBERS_COUNT',
        );
      }

      if (!rules.allowsDuplicates) {
        const uniqueSet = new Set(item.selectedNumbers);
        if (uniqueSet.size !== item.selectedNumbers.length) {
          throw ApiError.badRequest(`Ticket #${i + 1}: duplicate numbers are not allowed`, 'DUPLICATE_NUMBERS');
        }
      }

      for (const num of item.selectedNumbers) {
        if (num < rules.numberRangeMin || num > rules.numberRangeMax) {
          throw ApiError.badRequest(
            `Ticket #${i + 1}: number ${num} is out of valid range [${rules.numberRangeMin}, ${rules.numberRangeMax}]`,
            'NUMBER_OUT_OF_RANGE',
          );
        }
      }

      if (rules.bonusNumbersCount > 0) {
        if (item.bonusNumbers.length !== rules.bonusNumbersCount) {
          throw ApiError.badRequest(
            `Ticket #${i + 1}: must select exactly ${rules.bonusNumbersCount} bonus numbers`,
            'INVALID_BONUS_COUNT',
          );
        }

        if (rules.bonusRangeMin !== null && rules.bonusRangeMax !== null) {
          for (const bNum of item.bonusNumbers) {
            if (bNum < rules.bonusRangeMin || bNum > rules.bonusRangeMax) {
              throw ApiError.badRequest(
                `Ticket #${i + 1}: bonus number ${bNum} out of range [${rules.bonusRangeMin}, ${rules.bonusRangeMax}]`,
                'BONUS_OUT_OF_RANGE',
              );
            }
          }
        }
      }
    }

    // Generate unique ticket numbers and prepare purchase transaction
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const purchaseRef = idempotencyKey || `PUR-${datePrefix}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const ticketData = ticketItems.map((item, index) => {
      const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      return {
        ticketNumber: `TKT-${datePrefix}-${randomSuffix}-${index + 1}`,
        selectedNumbers: item.selectedNumbers.sort((a, b) => a - b),
        bonusNumbers: item.bonusNumbers.sort((a, b) => a - b),
      };
    });

    const ticketPrice = new Decimal(lottery.ticketPrice.toString());
    const totalCost = ticketPrice.mul(ticketItems.length);

    const createdTickets = await ticketRepository.purchaseTicketsTransaction({
      userId,
      lotteryId: lottery.id,
      lotteryName: lottery.name,
      ticketPrice,
      totalCost,
      purchaseReference: purchaseRef,
      ticketData,
    });

    await recordAuditLog({
      userId,
      actor: userId,
      action: 'TICKET_PURCHASED',
      resource: 'Ticket',
      resourceId: purchaseRef,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: {
        lotteryId: lottery.id,
        lotteryName: lottery.name,
        ticketCount: createdTickets.length,
        totalCost: totalCost.toString(),
      },
    });

    return {
      purchaseReference: purchaseRef,
      totalCost: totalCost.toString(),
      currency: lottery.currency,
      ticketCount: createdTickets.length,
      tickets: createdTickets,
    };
  }

  async listTickets(
    query: PaginationQuery & {
      lotteryId?: string;
      userId?: string;
      status?: TicketStatus;
      ticketNumber?: string;
    },
    user: { userId: string; roles: SystemRole[] },
  ) {
    // If not admin, restrict to own tickets
    const isAdmin =
      user.roles.includes(SystemRoles.SUPER_ADMIN) ||
      user.roles.includes(SystemRoles.ADMIN) ||
      user.roles.includes(SystemRoles.LOTTERY_OPERATOR);

    const safeUserId = isAdmin ? query.userId : user.userId;

    const { data, total } = await ticketRepository.findAll({
      ...query,
      userId: safeUserId,
    });

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getTicketById(id: string, user: { userId: string; roles: SystemRole[] }) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found', 'TICKET_NOT_FOUND');
    }

    const isAdmin =
      user.roles.includes(SystemRoles.SUPER_ADMIN) ||
      user.roles.includes(SystemRoles.ADMIN) ||
      user.roles.includes(SystemRoles.LOTTERY_OPERATOR);

    if (!isAdmin && ticket.userId !== user.userId) {
      throw ApiError.forbidden('Access denied to this ticket', 'FORBIDDEN');
    }

    return ticket;
  }
}

export const ticketService = new TicketService();
