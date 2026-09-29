import { prisma } from '../../config/database.js';
import { type LotteryStatus, type Prisma } from '@prisma/client';
import { getPaginationParams, type PaginationQuery } from '../../utils/pagination.js';

export class LotteryRepository {
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    ticketPrice: number;
    currency: string;
    maxTickets?: number;
    salesStart: Date;
    salesEnd: Date;
    drawDate: Date;
    rules: {
      minNumbers: number;
      maxNumbers: number;
      numberRangeMin: number;
      numberRangeMax: number;
      bonusNumbersCount: number;
      bonusRangeMin?: number;
      bonusRangeMax?: number;
      allowsDuplicates: boolean;
      termsAndConditions?: string;
    };
    prizes: Array<{
      tier: number;
      name: string;
      matchCount: number;
      matchBonus: boolean;
      prizeType: string;
      amount: number;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const lottery = await tx.lottery.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          ticketPrice: data.ticketPrice,
          currency: data.currency,
          maxTickets: data.maxTickets,
          salesStart: data.salesStart,
          salesEnd: data.salesEnd,
          drawDate: data.drawDate,
          status: 'DRAFT',
          rules: {
            create: data.rules,
          },
          prizes: {
            create: data.prizes,
          },
        },
        include: {
          rules: true,
          prizes: true,
        },
      });

      return lottery;
    });
  }

  async findAll(query: PaginationQuery & { status?: LotteryStatus; search?: string }) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.LotteryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.lottery.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          rules: true,
          prizes: {
            orderBy: { tier: 'asc' },
          },
          _count: {
            select: {
              tickets: true,
              draws: true,
            },
          },
        },
      }),
      prisma.lottery.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.lottery.findUnique({
      where: { id },
      include: {
        rules: true,
        prizes: {
          orderBy: { tier: 'asc' },
        },
        _count: {
          select: {
            tickets: true,
            draws: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.lottery.findUnique({
      where: { slug },
      include: {
        rules: true,
        prizes: true,
      },
    });
  }

  async update(id: string, data: Prisma.LotteryUpdateInput) {
    return prisma.lottery.update({
      where: { id },
      data,
      include: {
        rules: true,
        prizes: true,
      },
    });
  }

  async updateStatus(id: string, status: LotteryStatus) {
    return prisma.lottery.update({
      where: { id },
      data: { status },
      include: {
        rules: true,
        prizes: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.lottery.delete({
      where: { id },
    });
  }
}

export const lotteryRepository = new LotteryRepository();
