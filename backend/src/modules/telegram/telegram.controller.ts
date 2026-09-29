import { type Request, type Response } from 'express';
import { telegramService } from './telegram.service.js';
import { sendSuccess } from '../../utils/response.js';

export class TelegramController {
  login = async (req: Request, res: Response): Promise<void> => {
    const client = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const currentUserId = req.user?.userId;
    const result = await telegramService.authenticateWithTelegram(
      req.body.initData,
      client,
      currentUserId,
    );

    sendSuccess(res, result, 'Telegram authentication successful');
  };
}

export const telegramController = new TelegramController();
