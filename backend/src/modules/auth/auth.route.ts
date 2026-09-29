import { Router } from 'express';
import { authController } from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  telegramAuthSchema,
} from './auth.validation.js';
import { telegramController } from '../telegram/telegram.controller.js';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  authRateLimiter,
  passwordResetRateLimiter,
  telegramAuthRateLimiter,
} from '../../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

router.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshTokenSchema),
  asyncHandler(authController.refreshToken),
);

router.post(
  '/logout',
  asyncHandler(authController.logout),
);

router.post(
  '/verify-email',
  validateBody(verifyEmailSchema),
  asyncHandler(authController.verifyEmail),
);

router.post(
  '/resend-verification',
  authRateLimiter,
  validateBody(resendVerificationSchema),
  asyncHandler(authController.resendVerification),
);

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

router.post(
  '/telegram',
  telegramAuthRateLimiter,
  validateBody(telegramAuthSchema),
  asyncHandler(telegramController.login),
);

export const authRouter = router;
