import { Worker, type Job } from 'bullmq';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { drawService } from '../modules/draw/draw.service.js';
import {
  redisConnection,
  NOTIFICATION_QUEUE_NAME,
  DRAW_QUEUE_NAME,
  MAINTENANCE_QUEUE_NAME,
  type NotificationJobData,
  type DrawJobData,
} from './queue.js';

export class BackgroundWorker {
  private notificationWorker: Worker<NotificationJobData> | null = null;
  private drawWorker: Worker<DrawJobData> | null = null;
  private maintenanceWorker: Worker | null = null;

  start(): void {
    logger.info('Starting BullMQ background workers...');

    // 1. Notification Worker
    this.notificationWorker = new Worker<NotificationJobData>(
      NOTIFICATION_QUEUE_NAME,
      async (job: Job<NotificationJobData>) => {
        const { notificationId, channel, title } = job.data;
        logger.info({ jobId: job.id, channel, notificationId, title }, 'Processing notification delivery');

        // Deliver notification according to channel (Telegram, Email, Push)
        // Here we simulate external gateway delivery and stamp sentAt
        await prisma.notification.update({
          where: { id: notificationId },
          data: { sentAt: new Date() },
        });

        logger.info({ notificationId }, 'Notification delivered successfully');
        return { status: 'DELIVERED', notificationId };
      },
      { connection: redisConnection, concurrency: 10 },
    );

    this.notificationWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Notification delivery job failed');
    });

    // 2. Draw Execution Worker
    this.drawWorker = new Worker<DrawJobData>(
      DRAW_QUEUE_NAME,
      async (job: Job<DrawJobData>) => {
        const { drawId } = job.data;
        logger.info({ jobId: job.id, drawId }, 'Starting background draw execution');

        const result = await drawService.executeDraw(drawId, 'system-worker', {
          ipAddress: '127.0.0.1',
          userAgent: 'BullMQ-Worker',
        });

        logger.info({ drawId, totalWinners: result.totalWinners }, 'Background draw completed');
        return result;
      },
      { connection: redisConnection, concurrency: 2 },
    );

    this.drawWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Draw execution job failed');
    });

    // 3. Maintenance Worker (Token cleanup & Session Purging)
    this.maintenanceWorker = new Worker(
      MAINTENANCE_QUEUE_NAME,
      async (job: Job) => {
        logger.info({ jobId: job.id, name: job.name }, 'Running system maintenance task');

        const now = new Date();

        // Cleanup expired password reset tokens
        const expiredResets = await prisma.passwordResetToken.deleteMany({
          where: { expiresAt: { lt: now } },
        });

        // Cleanup expired email verification tokens
        const expiredVerifications = await prisma.emailVerificationToken.deleteMany({
          where: { expiresAt: { lt: now } },
        });

        // Cleanup revoked refresh tokens older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const expiredRefreshTokens = await prisma.refreshToken.deleteMany({
          where: {
            OR: [
              { isRevoked: true, createdAt: { lt: thirtyDaysAgo } },
              { expiresAt: { lt: now } },
            ],
          },
        });

        logger.info(
          {
            expiredResets: expiredResets.count,
            expiredVerifications: expiredVerifications.count,
            expiredRefreshTokens: expiredRefreshTokens.count,
          },
          'Token cleanup completed',
        );

        return { success: true };
      },
      { connection: redisConnection, concurrency: 1 },
    );

    logger.info('All background workers initialized successfully');
  }

  async stop(): Promise<void> {
    logger.info('Stopping background workers...');
    await Promise.all([
      this.notificationWorker?.close(),
      this.drawWorker?.close(),
      this.maintenanceWorker?.close(),
    ]);
    logger.info('Background workers stopped cleanly');
  }
}

export const backgroundWorker = new BackgroundWorker();

// Auto-run if executed directly as entrypoint (e.g. docker container worker service)
if (process.argv[1]?.includes('worker')) {
  backgroundWorker.start();

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down worker...`);
    await backgroundWorker.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
