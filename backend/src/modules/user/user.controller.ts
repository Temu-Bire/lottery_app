import { type Request, type Response } from 'express';
import { userService } from './user.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type UserStatus } from '@prisma/client';

export class UserController {
  getMe = async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getMe(req.user!.userId);
    sendSuccess(res, user, 'Profile retrieved successfully');
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const user = await userService.updateMe(req.user!.userId, req.body);
    sendSuccess(res, user, 'Profile updated successfully');
  };

  getMyTickets = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery;
    const result = await userService.getMyTickets(req.user!.userId, query);
    sendPaginated(res, result.data, result.pagination, 'User tickets retrieved');
  };

  getMyTransactions = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery;
    const result = await userService.getMyTransactions(req.user!.userId, query);
    sendPaginated(res, result.data, result.pagination, 'User transactions retrieved');
  };

  getMyWinners = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery;
    const result = await userService.getMyWinners(req.user!.userId, query);
    sendPaginated(res, result.data, result.pagination, 'User winnings retrieved');
  };

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & { status?: UserStatus; search?: string };
    const result = await userService.listUsers(query);
    sendPaginated(res, result.data, result.pagination, 'Users retrieved');
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getUserById(req.params.id as string);
    sendSuccess(res, user, 'User retrieved successfully');
  };

  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const user = await userService.updateUserStatus(
      req.params.id as string,
      req.body.status as UserStatus,
      req.body.reason as string | undefined,
      req.user!.userId,
      client,
    );
    sendSuccess(res, user, 'User status updated successfully');
  };
}

export const userController = new UserController();
