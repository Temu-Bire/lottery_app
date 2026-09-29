import { prisma } from '../../config/database.js';
import { enqueueNotification } from '../../jobs/queue.js';
import { buildPaginatedResult, type PaginationQuery } from '../../utils/pagination.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { type NotificationChannel, type NotificationEvent, type Prisma } from '@prisma/client';
import { ApiError } from '../../utils/errors.js';

export interface DispatchNotificationParams {
  userId: string;
  channel?: NotificationChannel;
  event: NotificationEvent;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Dispatches a notification non-blockingly via BullMQ background jobs
   */
  async dispatchNotification(params: DispatchNotificationParams): Promise<void> {
    const channel = params.channel || 'EMAIL';

    // 1. Create persistent notification record in database
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        channel,
        event: params.event,
        title: params.title,
        message: params.message,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    // 2. Enqueue background delivery task (asynchronous, non-blocking)
    await enqueueNotification({
      notificationId: notification.id,
      userId: params.userId,
      channel,
      event: params.event,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
    });
  }

  async listUserNotifications(
    userId: string,
    query: PaginationQuery & { isRead?: boolean },
  ) {
    const { skip, take, sortBy, sortOrder } = getPaginationParams(query);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden('Access denied', 'FORBIDDEN');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  }
}

export const notificationService = new NotificationService();
