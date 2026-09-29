import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { createPaymentSchema } from './payment.validation.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { paymentRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Webhook endpoint (no user authentication, signature-validated server-to-server)
router.post(
  '/webhook',
  paymentRateLimiter,
  asyncHandler(paymentController.webhook),
);

// Authenticated player endpoints
router.post(
  '/',
  authenticate,
  paymentRateLimiter,
  validateBody(createPaymentSchema),
  asyncHandler(paymentController.create),
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(paymentController.getById),
);

export const paymentRouter = router;
