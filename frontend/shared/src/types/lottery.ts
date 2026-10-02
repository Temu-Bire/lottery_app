import { PaginationQuery } from './api.js';

export type LotteryStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'OPEN'
  | 'CLOSED'
  | 'DRAWING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface LotteryRule {
  id?: string;
  lotteryId?: string;
  minNumbers: number;
  maxNumbers: number;
  numberRangeMin: number;
  numberRangeMax: number;
  bonusNumbersCount: number;
  bonusRangeMin?: number | null;
  bonusRangeMax?: number | null;
  allowsDuplicates: boolean;
  termsAndConditions?: string | null;
}

export interface PrizeTier {
  id?: string;
  tier: number;
  name: string;
  matchCount: number;
  matchBonus: boolean;
  prizeType: 'FIXED' | 'PERCENTAGE';
  amount: number | string;
}

export interface Lottery {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  ticketPrice: number | string;
  currency: string;
  maxTickets?: number | null;
  totalTicketsSold: number;
  salesStart: string;
  salesEnd: string;
  drawDate: string;
  status: LotteryStatus;
  createdAt: string;
  updatedAt: string;
  rules?: LotteryRule | null;
  prizes?: PrizeTier[];
  _count?: {
    tickets?: number;
    draws?: number;
  };
}

export interface CreateLotteryRequest {
  name: string;
  slug: string;
  description?: string;
  ticketPrice: number;
  currency?: string;
  maxTickets?: number;
  salesStart: string;
  salesEnd: string;
  drawDate: string;
  rules: {
    minNumbers: number;
    maxNumbers: number;
    numberRangeMin: number;
    numberRangeMax: number;
    bonusNumbersCount: number;
    bonusRangeMin?: number;
    bonusRangeMax?: number;
    allowsDuplicates?: boolean;
    termsAndConditions?: string;
  };
  prizes: Array<{
    tier: number;
    name: string;
    matchCount: number;
    matchBonus?: boolean;
    prizeType?: 'FIXED' | 'PERCENTAGE';
    amount: number;
  }>;
}

export interface UpdateLotteryRequest {
  name?: string;
  description?: string;
  ticketPrice?: number;
  maxTickets?: number;
  salesStart?: string;
  salesEnd?: string;
  drawDate?: string;
}

export interface LotteryListQuery extends PaginationQuery {
  status?: LotteryStatus;
  search?: string;
}
