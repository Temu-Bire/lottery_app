import { type Request, type Response } from 'express';
import { ticketService } from './ticket.service.js';
import { sendCreated, sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type TicketStatus } from '@prisma/client';

export class TicketController {
  purchase = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const lotteryId = (req.params.id || req.params.lotteryId) as string;
    const result = await ticketService.purchaseTickets(
      lotteryId,
      req.user!.userId,
      req.body.tickets,
      req.body.idempotencyKey,
      client,
    );
    sendCreated(res, result, 'Tickets purchased successfully');
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & {
      lotteryId?: string;
      userId?: string;
      status?: TicketStatus;
      ticketNumber?: string;
    };
    const result = await ticketService.listTickets(query, req.user!);
    sendPaginated(res, result.data, result.pagination, 'Tickets retrieved successfully');
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const ticket = await ticketService.getTicketById(req.params.id as string, req.user!);
    sendSuccess(res, ticket, 'Ticket retrieved successfully');
  };
}

export const ticketController = new TicketController();
