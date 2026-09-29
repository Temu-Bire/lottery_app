import { Router } from 'express';
import { ticketController } from './ticket.controller.js';
import { ticketListQuerySchema } from './ticket.validation.js';
import { authenticate } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(ticketListQuerySchema),
  asyncHandler(ticketController.list),
);

router.get(
  '/:id',
  asyncHandler(ticketController.getById),
);

export const ticketRouter = router;
