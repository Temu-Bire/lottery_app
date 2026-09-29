import { Router } from 'express';
import { winnerController } from './winner.controller.js';
import { winnerListQuerySchema } from '../draw/draw.validation.js';
import { validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  validateQuery(winnerListQuerySchema),
  asyncHandler(winnerController.list),
);

router.get(
  '/:id',
  asyncHandler(winnerController.getById),
);

export const winnerRouter = router;
