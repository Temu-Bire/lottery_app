import { Router } from 'express';
import { walletController } from './wallet.controller.js';
import { paginationQuerySchema } from '../../utils/pagination.js';
import { authenticate } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(walletController.getWallet),
);

router.get(
  '/transactions',
  validateQuery(paginationQuerySchema),
  asyncHandler(walletController.getTransactions),
);

router.post(
  '/claim-prize/:winnerId',
  asyncHandler(walletController.claimPrize),
);

router.get(
  '/consistency',
  asyncHandler(walletController.verifyConsistency),
);

export const walletRouter = router;
