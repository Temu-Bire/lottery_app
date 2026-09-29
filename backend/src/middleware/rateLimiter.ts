import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { type Request, type Response, type NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';

const rateLimitHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.tooManyRequests('Too many requests, please try again later', 'RATE_LIMIT_EXCEEDED'));
};

export const globalRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 100, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => req.path.endsWith('/health') || req.path === '/health',
});

export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const passwordResetRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const telegramAuthRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const paymentRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
