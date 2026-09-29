import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { authenticate } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(paginationQuerySchema),
  asyncHandler(notificationController.list),
);

router.patch(
  '/:id/read',
  asyncHandler(notificationController.markAsRead),
);

router.post(
  '/read-all',
  asyncHandler(notificationController.markAllAsRead),
);

export const notificationRouter = router;
