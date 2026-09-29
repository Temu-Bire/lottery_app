import { type Request, type Response } from 'express';
import { drawService } from './draw.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type DrawStatus } from '@prisma/client';

export class DrawController {
  execute = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await drawService.executeDraw(
      req.params.id as string,
      req.user!.userId,
      client,
    );
    sendSuccess(res, result, 'Draw executed successfully');
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & { lotteryId?: string; status?: DrawStatus };
    const result = await drawService.listDraws(query);
    sendPaginated(res, result.data, result.pagination, 'Draws retrieved successfully');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const draw = await drawService.getDrawById(req.params.id as string);
    sendSuccess(res, draw, 'Draw retrieved successfully');
  };

  getResults = async (req: Request, res: Response): Promise<void> => {
    const results = await drawService.getDrawResults(req.params.id as string);
    sendSuccess(res, results, 'Draw results retrieved successfully');
  };
}

export const drawController = new DrawController();
