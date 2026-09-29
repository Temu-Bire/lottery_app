import { Router } from 'express';
import { withdrawalController } from './withdrawal.controller.js';
import {
  createWithdrawalSchema,
  withdrawalListQuerySchema,
} from './withdrawal.validation.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validateBody(createWithdrawalSchema),
  asyncHandler(withdrawalController.create),
);

router.get(
  '/',
  validateQuery(withdrawalListQuerySchema),
  asyncHandler(withdrawalController.listUser),
);

router.get(
  '/:id',
  asyncHandler(withdrawalController.getById),
);

export const withdrawalRouter = router;
