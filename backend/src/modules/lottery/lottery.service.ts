import { lotteryRepository } from './lottery.repository.js';
import { validateLotteryTransition } from './lottery.types.js';
import { ApiError } from '../../utils/errors.js';
import { recordAuditLog } from '../../utils/audit.js';
import { buildPaginatedResult, type PaginationQuery } from '../../utils/pagination.js';
import { LotteryStatus, type Prisma } from '@prisma/client';
import { type ClientContext } from '../auth/auth.service.js';

export class LotteryService {
  async createLottery(
    data: Parameters<typeof lotteryRepository.create>[0],
    adminId: string,
    client: ClientContext,
  ) {
    const existing = await lotteryRepository.findBySlug(data.slug);
    if (existing) {
      throw ApiError.conflict('A lottery with this slug already exists', 'SLUG_ALREADY_EXISTS');
    }

    const lottery = await lotteryRepository.create(data);

    await recordAuditLog({
      userId: adminId,
      actor: adminId,
      action: 'LOTTERY_CREATED',
      resource: 'Lottery',
      resourceId: lottery.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { name: lottery.name, slug: lottery.slug },
    });

    return lottery;
  }

  async listLotteries(query: PaginationQuery & { status?: LotteryStatus; search?: string }) {
    const { data, total } = await lotteryRepository.findAll(query);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async getLotteryById(id: string) {
    const lottery = await lotteryRepository.findById(id);
    if (!lottery) {
      throw ApiError.notFound('Lottery not found', 'LOTTERY_NOT_FOUND');
    }
    return lottery;
  }

  async updateLottery(
    id: string,
    data: Prisma.LotteryUpdateInput,
    adminId: string,
    client: ClientContext,
  ) {
    const lottery = await this.getLotteryById(id);

    if (lottery.status !== LotteryStatus.DRAFT && lottery.status !== LotteryStatus.SCHEDULED) {
      throw ApiError.badRequest(
        'Cannot modify lottery details once tickets are open or sales have commenced',
        'LOTTERY_LOCKED',
      );
    }

    const updated = await lotteryRepository.update(id, data);

    await recordAuditLog({
      userId: adminId,
      actor: adminId,
      action: 'LOTTERY_UPDATED',
      resource: 'Lottery',
      resourceId: id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return updated;
  }

  async deleteLottery(id: string, adminId: string, client: ClientContext) {
    const lottery = await this.getLotteryById(id);

    if (lottery.status !== LotteryStatus.DRAFT) {
      throw ApiError.badRequest(
        'Only lotteries in DRAFT status can be permanently deleted. Use cancel instead.',
        'CANNOT_DELETE_ACTIVE_LOTTERY',
      );
    }

    if (lottery._count.tickets > 0) {
      throw ApiError.badRequest('Cannot delete lottery with existing tickets', 'TICKETS_EXIST');
    }

    await lotteryRepository.delete(id);

    await recordAuditLog({
      userId: adminId,
      actor: adminId,
      action: 'SECURITY_EVENT',
      resource: 'Lottery',
      resourceId: id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { action: 'LOTTERY_DELETED', name: lottery.name },
    });

    return { success: true };
  }

  async openLottery(id: string, adminId: string, client: ClientContext) {
    const lottery = await this.getLotteryById(id);
    validateLotteryTransition(lottery.status, LotteryStatus.OPEN);

    const updated = await lotteryRepository.updateStatus(id, LotteryStatus.OPEN);

    await recordAuditLog({
      userId: adminId,
      actor: adminId,
      action: 'LOTTERY_OPENED',
      resource: 'Lottery',
      resourceId: id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return updated;
  }

  async closeLottery(id: string, adminId: string, client: ClientContext) {
    const lottery = await this.getLotteryById(id);
    validateLotteryTransition(lottery.status, LotteryStatus.CLOSED);

    const updated = await lotteryRepository.updateStatus(id, LotteryStatus.CLOSED);

    await recordAuditLog({
      userId: adminId,
      actor: adminId,
      action: 'LOTTERY_CLOSED',
      resource: 'Lottery',
      resourceId: id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return updated;
  }

  async cancelLottery(id: string, adminId: string, client: ClientContext) {
    const lottery = await this.getLotteryById(id);
    validateLotteryTransition(lottery.status, LotteryStatus.CANCELLED);

    const updated = await lotteryRepository.updateStatus(id, LotteryStatus.CANCELLED);

    await recordAuditLog({
      userId: adminId,
      actor: adminId,
      action: 'SECURITY_EVENT',
      resource: 'Lottery',
      resourceId: id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { action: 'LOTTERY_CANCELLED' },
    });

    return updated;
  }
}

export const lotteryService = new LotteryService();
