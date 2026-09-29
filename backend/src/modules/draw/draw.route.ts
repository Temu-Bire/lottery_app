import { Router } from 'express';
import { drawController } from './draw.controller.js';
import { drawListQuerySchema } from './draw.validation.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { SystemPermissions } from '../role/role.types.js';

const router = Router();

router.get(
  '/',
  validateQuery(drawListQuerySchema),
  asyncHandler(drawController.list),
);

router.get(
  '/:id',
  asyncHandler(drawController.getById),
);

router.get(
  '/:id/results',
  asyncHandler(drawController.getResults),
);

router.post(
  '/:id/execute',
  authenticate,
  requirePermission(SystemPermissions.DRAW_EXECUTE),
  asyncHandler(drawController.execute),
);

export const drawRouter = router;
