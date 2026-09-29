import { type Request, type Response } from 'express';
import { adminService } from './admin.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { type PaginationQuery } from '../../utils/pagination.js';
import { type AuditAction } from '@prisma/client';

export class AdminController {
  getReports = async (_req: Request, res: Response): Promise<void> => {
    const report = await adminService.getSystemReport();
    sendSuccess(res, report, 'System report retrieved successfully');
  };

  getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PaginationQuery & {
      action?: AuditAction;
      actor?: string;
      resource?: string;
    };
    const result = await adminService.listAuditLogs(query);
    sendPaginated(res, result.data, result.pagination, 'Audit logs retrieved successfully');
  };
}

export const adminController = new AdminController();
