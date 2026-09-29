import { type Response } from 'express';
import { type PaginationMeta } from './pagination.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = 'Success',
  statusCode: number = 200,
): void => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  };
  res.status(statusCode).json(payload);
};

export const sendCreated = <T>(res: Response, data?: T, message: string = 'Created successfully'): void => {
  sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message: string = 'Fetched successfully',
): void => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};
