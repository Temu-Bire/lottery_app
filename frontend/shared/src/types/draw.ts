import { PaginationQuery } from './api.js';
import { Lottery } from './lottery.js';

export type DrawStatus = 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WinningNumber {
  id: string;
  drawId: string;
  numbers: number[];
  bonusNumbers: number[];
  drawnAt: string;
}

export interface Draw {
  id: string;
  lotteryId: string;
  drawNumber: number;
  status: DrawStatus;
  scheduledAt: string;
  executedAt?: string | null;
  seed?: string | null;
  randomnessProof?: string | null;
  createdAt: string;
  updatedAt: string;
  lottery?: Lottery;
  winningNumbers?: WinningNumber[];
  _count?: {
    winners?: number;
  };
}

export interface DrawListQuery extends PaginationQuery {
  lotteryId?: string;
  status?: DrawStatus;
}
