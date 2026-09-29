import { LotteryStatus } from '@prisma/client';
import { ApiError } from '../../utils/errors.js';

export const VALID_LOTTERY_TRANSITIONS: Record<LotteryStatus, LotteryStatus[]> = {
  [LotteryStatus.DRAFT]: [LotteryStatus.SCHEDULED, LotteryStatus.OPEN, LotteryStatus.CANCELLED],
  [LotteryStatus.SCHEDULED]: [LotteryStatus.OPEN, LotteryStatus.CANCELLED],
  [LotteryStatus.OPEN]: [LotteryStatus.CLOSED, LotteryStatus.CANCELLED],
  [LotteryStatus.CLOSED]: [LotteryStatus.DRAWING, LotteryStatus.CANCELLED],
  [LotteryStatus.DRAWING]: [LotteryStatus.COMPLETED, LotteryStatus.CANCELLED],
  [LotteryStatus.COMPLETED]: [],
  [LotteryStatus.CANCELLED]: [],
};

export const validateLotteryTransition = (current: LotteryStatus, next: LotteryStatus): void => {
  const allowed = VALID_LOTTERY_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(
      `Invalid lottery status transition from ${current} to ${next}`,
      'INVALID_STATUS_TRANSITION',
    );
  }
};
