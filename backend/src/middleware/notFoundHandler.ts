import { type Request, type Response, type NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};
