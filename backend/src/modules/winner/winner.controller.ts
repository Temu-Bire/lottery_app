import { type Request, type Response } from 'express';
import { drawService } from '../draw/draw.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type WinnerStatus, type PayoutStatus } from '@prisma/client';

export class WinnerController {
  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & {
      drawId?: string;
      userId?: string;
      status?: WinnerStatus;
      payoutStatus?: PayoutStatus;
    };
    const result = await drawService.listWinners(query);
    sendPaginated(res, result.data, result.pagination, 'Winners retrieved successfully');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const winner = await drawService.getWinnerById(req.params.id as string);
    sendSuccess(res, winner, 'Winner retrieved successfully');
  };
}

export const winnerController = new WinnerController();
