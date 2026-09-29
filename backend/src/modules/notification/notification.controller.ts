import { type Request, type Response } from 'express';
import { notificationService } from './notification.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';

export class NotificationController {
  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & { isRead?: boolean };
    const result = await notificationService.listUserNotifications(req.user!.userId, query);
    sendPaginated(res, result.data, result.pagination, 'Notifications retrieved successfully');
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    await notificationService.markAsRead(req.params.id as string, req.user!.userId);
    sendSuccess(res, { success: true }, 'Notification marked as read');
  };

  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    const result = await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, result, 'All notifications marked as read');
  };
}

export const notificationController = new NotificationController();
