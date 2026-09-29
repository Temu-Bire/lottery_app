import { Router } from 'express';
import { userController } from './user.controller.js';
import { updateMeSchema } from './user.validation.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/me', asyncHandler(userController.getMe));
router.patch('/me', validateBody(updateMeSchema), asyncHandler(userController.updateMe));
router.get('/me/tickets', validateQuery(paginationQuerySchema), asyncHandler(userController.getMyTickets));
router.get('/me/transactions', validateQuery(paginationQuerySchema), asyncHandler(userController.getMyTransactions));
router.get('/me/winners', validateQuery(paginationQuerySchema), asyncHandler(userController.getMyWinners));

export const userRouter = router;
