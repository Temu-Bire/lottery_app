import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

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

  return app;
};

export const app = createApp();
