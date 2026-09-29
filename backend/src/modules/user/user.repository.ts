import { prisma } from '../../config/database.js';
import { type User, type Ticket, type WalletTransaction, type Winner, type UserStatus, type Prisma } from '@prisma/client';
import { getPaginationParams, type PaginationQuery } from '../../utils/pagination.js';

export class UserRepository {
  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            balance: true,
            lockedBalance: true,
            currency: true,
          },
        },
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async updateMe(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async getUserTickets(
    userId: string,
    query: PaginationQuery,
  ): Promise<{ data: Ticket[]; total: number }> {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { userId },
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
        },
      }),
      prisma.ticket.count({ where: { userId } }),
    ]);

    return { data, total };
  }

  async getUserTransactions(
    userId: string,
    query: PaginationQuery,
  ): Promise<{ data: WalletTransaction[]; total: number }> {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wallet) return { data: [], total: 0 };

    const [data, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return { data, total };
  }

  async getUserWinners(
    userId: string,
    query: PaginationQuery,
  ): Promise<{ data: Winner[]; total: number }> {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const [data, total] = await Promise.all([
      prisma.winner.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          draw: {
            select: {
              drawNumber: true,
              lottery: {
                select: { name: true },
              },
            },
          },
          prize: {
            select: {
              name: true,
              tier: true,
            },
          },
        },
      }),
      prisma.winner.count({ where: { userId } }),
    ]);

    return { data, total };
  }

  async findUsers(
    query: PaginationQuery & { status?: UserStatus; search?: string },
  ): Promise<{ data: unknown[]; total: number }> {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);

    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          phone: true,
          status: true,
          emailVerified: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          wallet: {
            select: {
              balance: true,
              lockedBalance: true,
              currency: true,
            },
          },
          userRoles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }
}

export const userRepository = new UserRepository();
