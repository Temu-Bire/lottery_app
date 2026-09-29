import { Router } from 'express';
import { withdrawalController } from './withdrawal.controller.js';
import {
  reviewWithdrawalSchema,
  withdrawalListQuerySchema,
} from './withdrawal.validation.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { SystemPermissions } from '../role/role.types.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission(SystemPermissions.WITHDRAWAL_READ),
  validateQuery(withdrawalListQuerySchema),
  asyncHandler(withdrawalController.listAdmin),
);

router.post(
  '/:id/approve',
  requirePermission(SystemPermissions.WITHDRAWAL_APPROVE),
  validateBody(reviewWithdrawalSchema),
  asyncHandler(withdrawalController.approve),
);

router.post(
  '/:id/reject',
  requirePermission(SystemPermissions.WITHDRAWAL_APPROVE),
  validateBody(reviewWithdrawalSchema),
  asyncHandler(withdrawalController.reject),
);

export const withdrawalAdminRouter = router;
