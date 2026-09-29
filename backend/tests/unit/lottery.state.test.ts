import { describe, it, expect } from 'vitest';
import { validateLotteryTransition, VALID_LOTTERY_TRANSITIONS } from '../../src/modules/lottery/lottery.types.js';
import { LotteryStatus } from '@prisma/client';
import { ApiError } from '../../src/utils/errors.js';

describe('Lottery Lifecycle State Machine', () => {
  it('should allow valid sequential transitions: DRAFT -> SCHEDULED -> OPEN -> CLOSED -> DRAWING -> COMPLETED', () => {
    expect(() => validateLotteryTransition(LotteryStatus.DRAFT, LotteryStatus.SCHEDULED)).not.toThrow();
    expect(() => validateLotteryTransition(LotteryStatus.SCHEDULED, LotteryStatus.OPEN)).not.toThrow();
    expect(() => validateLotteryTransition(LotteryStatus.OPEN, LotteryStatus.CLOSED)).not.toThrow();
    expect(() => validateLotteryTransition(LotteryStatus.CLOSED, LotteryStatus.DRAWING)).not.toThrow();
    expect(() => validateLotteryTransition(LotteryStatus.DRAWING, LotteryStatus.COMPLETED)).not.toThrow();
  });

  it('should reject invalid backward or skipping transitions', () => {
    expect(() => validateLotteryTransition(LotteryStatus.DRAFT, LotteryStatus.DRAWING)).toThrow(ApiError);
    expect(() => validateLotteryTransition(LotteryStatus.COMPLETED, LotteryStatus.OPEN)).toThrow(ApiError);
    expect(() => validateLotteryTransition(LotteryStatus.CLOSED, LotteryStatus.OPEN)).toThrow(ApiError);
    expect(() => validateLotteryTransition(LotteryStatus.CANCELLED, LotteryStatus.SCHEDULED)).toThrow(ApiError);
  });

  it('should allow cancellation from non-terminal states', () => {
    expect(() => validateLotteryTransition(LotteryStatus.DRAFT, LotteryStatus.CANCELLED)).not.toThrow();
    expect(() => validateLotteryTransition(LotteryStatus.SCHEDULED, LotteryStatus.CANCELLED)).not.toThrow();
    expect(() => validateLotteryTransition(LotteryStatus.OPEN, LotteryStatus.CANCELLED)).not.toThrow();
    expect(VALID_LOTTERY_TRANSITIONS[LotteryStatus.COMPLETED]).toHaveLength(0);
  });
});
