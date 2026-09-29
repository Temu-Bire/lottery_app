import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { SystemPermissions } from '../role/role.types.js';

const router = Router();

router.use(authenticate);

router.get(
  '/reports',
  requirePermission(SystemPermissions.REPORT_READ),
  asyncHandler(adminController.getReports),
);

router.get(
  '/audit-logs',
  requirePermission(SystemPermissions.AUDIT_READ),
  validateQuery(paginationQuerySchema),
  asyncHandler(adminController.getAuditLogs),
);

export const adminRouter = router;
