import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './modules/auth/auth.route.js';
import { userRouter } from './modules/user/user.route.js';
import { userAdminRouter } from './modules/user/user.admin.route.js';
import { lotteryRouter } from './modules/lottery/lottery.route.js';
import { ticketRouter } from './modules/ticket/ticket.route.js';
import { drawRouter } from './modules/draw/draw.route.js';
import { winnerRouter } from './modules/winner/winner.route.js';
import { walletRouter } from './modules/wallet/wallet.route.js';
import { paymentRouter } from './modules/payment/payment.route.js';
import { withdrawalRouter } from './modules/withdrawal/withdrawal.route.js';
import { withdrawalAdminRouter } from './modules/withdrawal/withdrawal.admin.route.js';

export const createApp = (): Application => {
  const app: Application = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(globalRateLimiter);

  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
    }),
  );

  const healthHandler = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  };

  app.get('/health', healthHandler);
  app.get(`${env.API_PREFIX}/health`, healthHandler);

  // API v1 Routes
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/users`, userRouter);
  app.use(`${env.API_PREFIX}/admin/users`, userAdminRouter);
  app.use(`${env.API_PREFIX}/lotteries`, lotteryRouter);
  app.use(`${env.API_PREFIX}/tickets`, ticketRouter);
  app.use(`${env.API_PREFIX}/draws`, drawRouter);
  app.use(`${env.API_PREFIX}/winners`, winnerRouter);
  app.use(`${env.API_PREFIX}/wallet`, walletRouter);
  app.use(`${env.API_PREFIX}/payments`, paymentRouter);
  app.use(`${env.API_PREFIX}/withdrawals`, withdrawalRouter);
  app.use(`${env.API_PREFIX}/admin/withdrawals`, withdrawalAdminRouter);

  // 404 and Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
