import { type Server } from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

let server: Server | null = null;

export const startServer = (): Server => {
  server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        prefix: env.API_PREFIX,
      },
      `Server successfully started on port ${env.PORT}`,
    );
  });

  const handleShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed successfully.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  return server;
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
