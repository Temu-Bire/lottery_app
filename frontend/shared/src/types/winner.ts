import { PaginationQuery } from './api.js';
import { Draw } from './draw.js';
import { Ticket } from './ticket.js';
import { PrizeTier } from './lottery.js';

export type WinnerStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
export type PayoutStatus = 'UNPAID' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface Winner {
  id: string;
  drawId: string;
  ticketId: string;
  userId: string;
  prizeId: string;
  matchCount: number;
  matchedBonus: boolean;
  prizeAmount: number | string;
  status: WinnerStatus;
  payoutStatus: PayoutStatus;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  draw?: Draw;
  ticket?: Ticket;
  prize?: PrizeTier;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface WinnerListQuery extends PaginationQuery {
  drawId?: string;
  userId?: string;
  status?: WinnerStatus;
  payoutStatus?: PayoutStatus;
}
