import { Router } from 'express';
import { userController } from './user.controller.js';
import { userListQuerySchema, updateUserStatusSchema } from './user.validation.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { SystemPermissions } from '../role/role.types.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission(SystemPermissions.USER_READ),
  validateQuery(userListQuerySchema),
  asyncHandler(userController.listUsers),
);

router.get(
  '/:id',
  requirePermission(SystemPermissions.USER_READ),
  asyncHandler(userController.getUserById),
);

router.patch(
  '/:id/status',
  requirePermission(SystemPermissions.USER_SUSPEND),
  validateBody(updateUserStatusSchema),
  asyncHandler(userController.updateUserStatus),
);

export const userAdminRouter = router;
