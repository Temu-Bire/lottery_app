import { type Request, type Response, type NextFunction, type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  stack?: string;
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal error occurred';
  let details: unknown = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      rule: issue.code,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : 'field';
      message = `A record with this ${target} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'The requested resource was not found';
    } else {
      statusCode = 400;
      code = 'DATABASE_ERROR';
      message = 'Database operation failed';
    }
  } else if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Invalid JSON payload received';
  } else {
    logger.error({ err }, 'Unhandled server error');
  }

  const response: ErrorResponse = {
    success: false,
    message,
    code,
    ...(details !== undefined ? { details } : {}),
    ...(env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(response);
};
