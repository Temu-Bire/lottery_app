import { Queue, type JobsOptions } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { type NotificationChannel, type NotificationEvent } from '@prisma/client';

export const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
};

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    count: 500,
    age: 24 * 3600,
  },
  removeOnFail: {
    count: 1000,
  },
};

export interface NotificationJobData {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DrawJobData {
  drawId: string;
  lotteryId: string;
  scheduledAt: string;
}

export const NOTIFICATION_QUEUE_NAME = 'lottery-notifications';
export const DRAW_QUEUE_NAME = 'lottery-draws';
export const MAINTENANCE_QUEUE_NAME = 'lottery-maintenance';

export const notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions,
});

export const drawQueue = new Queue<DrawJobData>(DRAW_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions,
});

export const maintenanceQueue = new Queue(MAINTENANCE_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions,
});

export const enqueueNotification = async (data: NotificationJobData): Promise<void> => {
  try {
    await notificationQueue.add(`notify-${data.event}-${data.notificationId}`, data);
  } catch (error) {
    logger.warn({ error, notificationId: data.notificationId }, 'Deferred queuing notification');
  }
};

export const enqueueScheduledDraw = async (data: DrawJobData, delayMs: number): Promise<void> => {
  try {
    await drawQueue.add(`draw-${data.drawId}`, data, {
      delay: Math.max(0, delayMs),
      jobId: `draw-${data.drawId}`,
    });
  } catch (error) {
    logger.warn({ error, drawId: data.drawId }, 'Deferred scheduling draw job');
  }
};
