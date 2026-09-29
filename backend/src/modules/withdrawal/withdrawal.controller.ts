import { type Request, type Response } from 'express';
import { withdrawalService } from './withdrawal.service.js';
import { sendCreated, sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type WithdrawalStatus } from '@prisma/client';

export class WithdrawalController {
  create = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await withdrawalService.requestWithdrawal(
      req.user!.userId,
      req.body,
      client,
    );
    sendCreated(res, result, 'Withdrawal request created successfully');
  };

  listUser = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & { status?: WithdrawalStatus };
    const result = await withdrawalService.listUserWithdrawals(req.user!.userId, query);
    sendPaginated(res, result.data, result.pagination, 'User withdrawals retrieved');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const result = await withdrawalService.getWithdrawalById(req.params.id as string, req.user!);
    sendSuccess(res, result, 'Withdrawal retrieved successfully');
  };

  listAdmin = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & { userId?: string; status?: WithdrawalStatus };
    const result = await withdrawalService.listAdminWithdrawals(query);
    sendPaginated(res, result.data, result.pagination, 'Withdrawals retrieved');
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await withdrawalService.approveWithdrawal(
      req.params.id as string,
      req.user!.userId,
      req.body.note as string | undefined,
      client,
    );
    sendSuccess(res, result, 'Withdrawal approved and funds settled');
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await withdrawalService.rejectWithdrawal(
      req.params.id as string,
      req.user!.userId,
      req.body.note as string | undefined,
      client,
    );
    sendSuccess(res, result, 'Withdrawal rejected and funds refunded');
  };
}

export const withdrawalController = new WithdrawalController();
