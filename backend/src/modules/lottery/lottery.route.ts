import { Router } from 'express';
import { lotteryController } from './lottery.controller.js';
import {
  createLotterySchema,
  updateLotterySchema,
  lotteryListQuerySchema,
} from './lottery.validation.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { SystemPermissions } from '../role/role.types.js';
import { ticketController } from '../ticket/ticket.controller.js';
import { purchaseTicketsSchema } from '../ticket/ticket.validation.js';

const router = Router();

// Public / Player endpoints
router.get(
  '/',
  validateQuery(lotteryListQuerySchema),
  asyncHandler(lotteryController.list),
);

router.get(
  '/:id',
  asyncHandler(lotteryController.getById),
);

// Ticket purchase under lottery
router.post(
  '/:id/tickets',
  authenticate,
  validateBody(purchaseTicketsSchema),
  asyncHandler(ticketController.purchase),
);

// Management endpoints
router.post(
  '/',
  authenticate,
  requirePermission(SystemPermissions.LOTTERY_CREATE),
  validateBody(createLotterySchema),
  asyncHandler(lotteryController.create),
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(SystemPermissions.LOTTERY_UPDATE),
  validateBody(updateLotterySchema),
  asyncHandler(lotteryController.update),
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(SystemPermissions.LOTTERY_DELETE),
  asyncHandler(lotteryController.delete),
);

router.post(
  '/:id/open',
  authenticate,
  requirePermission(SystemPermissions.LOTTERY_UPDATE),
  asyncHandler(lotteryController.open),
);

router.post(
  '/:id/close',
  authenticate,
  requirePermission(SystemPermissions.LOTTERY_UPDATE),
  asyncHandler(lotteryController.close),
);

router.post(
  '/:id/cancel',
  authenticate,
  requirePermission(SystemPermissions.LOTTERY_DELETE),
  asyncHandler(lotteryController.cancel),
);

export const lotteryRouter = router;
