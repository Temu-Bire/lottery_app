import { type Request, type Response } from 'express';
import { walletService } from './wallet.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type WalletOperation } from '@prisma/client';

export class WalletController {
  getWallet = async (req: Request, res: Response): Promise<void> => {
    const result = await walletService.getWallet(req.user!.userId);
    sendSuccess(res, result, 'Wallet retrieved successfully');
  };

  getTransactions = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & { operation?: WalletOperation };
    const result = await walletService.getTransactions(req.user!.userId, query);
    sendPaginated(res, result.data, result.pagination, 'Transactions retrieved successfully');
  };

  claimPrize = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await walletService.claimPrize(
      req.user!.userId,
      req.params.winnerId as string,
      client,
    );
    sendSuccess(res, result, 'Prize claimed and credited to wallet');
  };

  verifyConsistency = async (req: Request, res: Response): Promise<void> => {
    const result = await walletService.verifyFinancialConsistency(req.user!.userId);
    sendSuccess(res, result, 'Financial consistency verification completed');
  };
}

export const walletController = new WalletController();
