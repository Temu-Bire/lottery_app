import { prisma } from '../../config/database.js';
import { getPaginationParams, buildPaginatedResult, type PaginationQuery } from '../../utils/pagination.js';
import { type AuditAction, type Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class AdminService {
  async getSystemReport() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalLotteries,
      lotteriesByStatus,
      ticketStats,
      prizeStats,
      depositStats,
      withdrawalStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.lottery.count(),
      prisma.lottery.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.ticket.aggregate({
        _count: true,
        _sum: { price: true },
      }),
      prisma.winner.aggregate({
        _count: true,
        _sum: { prizeAmount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { operation: 'DEPOSIT', status: 'COMPLETED' },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { operation: 'WITHDRAWAL', status: 'COMPLETED' },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    const grossSales = ticketStats._sum.price || new Decimal(0);
    const totalPrizes = prizeStats._sum.prizeAmount || new Decimal(0);
    const netRevenue = grossSales.minus(totalPrizes);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      lotteries: {
        total: totalLotteries,
        byStatus: lotteriesByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>),
      },
      tickets: {
        totalSold: ticketStats._count,
        grossSales: grossSales.toString(),
      },
      prizes: {
        totalWinners: prizeStats._count,
        totalAwarded: totalPrizes.toString(),
      },
      financialSummary: {
        netRevenue: netRevenue.toString(),
        totalDeposits: (depositStats._sum.amount || new Decimal(0)).toString(),
        totalWithdrawals: (withdrawalStats._sum.amount || new Decimal(0)).toString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async listAuditLogs(
    query: PaginationQuery & {
      action?: AuditAction;
      actor?: string;
      resource?: string;
    },
  ) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.actor ? { actor: { contains: query.actor, mode: 'insensitive' } } : {}),
      ...(query.resource ? { resource: { contains: query.resource, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
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
      prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }
}

export const adminService = new AdminService();
