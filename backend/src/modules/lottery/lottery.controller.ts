import { type Request, type Response } from 'express';
import { lotteryService } from './lottery.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type LotteryStatus } from '@prisma/client';

export class LotteryController {
  create = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const lottery = await lotteryService.createLottery(req.body, req.user!.userId, client);
    sendCreated(res, lottery, 'Lottery created successfully');
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & { status?: LotteryStatus; search?: string };
    const result = await lotteryService.listLotteries(query);
    sendPaginated(res, result.data, result.pagination, 'Lotteries retrieved successfully');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const lottery = await lotteryService.getLotteryById(req.params.id as string);
    sendSuccess(res, lottery, 'Lottery retrieved successfully');
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const lottery = await lotteryService.updateLottery(
      req.params.id as string,
      req.body,
      req.user!.userId,
      client,
    );
    sendSuccess(res, lottery, 'Lottery updated successfully');
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await lotteryService.deleteLottery(req.params.id as string, req.user!.userId, client);
    sendSuccess(res, result, 'Lottery deleted successfully');
  };

  open = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const lottery = await lotteryService.openLottery(req.params.id as string, req.user!.userId, client);
    sendSuccess(res, lottery, 'Lottery opened for ticket sales');
  };

  close = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const lottery = await lotteryService.closeLottery(req.params.id as string, req.user!.userId, client);
    sendSuccess(res, lottery, 'Lottery ticket sales closed');
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const lottery = await lotteryService.cancelLottery(req.params.id as string, req.user!.userId, client);
    sendSuccess(res, lottery, 'Lottery cancelled successfully');
  };
}

export const lotteryController = new LotteryController();
